import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase, getUserIdFromRequest } from "@/lib/supabase/server";
import { sendOrderConfirmation, sendAdminOrderAlert } from "@/lib/email";
import { rejectForbiddenOrigin } from "@/lib/api/origin";
import { limiters, getIp, checkDualLimit } from "@/lib/api/ratelimit";

// Tolerance for floating-point amount comparison (£0.01)
const AMOUNT_TOLERANCE = 0.01;

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  // Resolve user identity before rate limiting so the per-user bucket
  // applies in addition to the per-IP bucket.
  const userId = await getUserIdFromRequest(request);
  const limited = await checkDualLimit(limiters.finalize, ip, userId);
  if (limited) return limited;

  const forbidden = rejectForbiddenOrigin(request);
  if (forbidden) return forbidden;

  const token = process.env.SUMUP_API_KEY?.trim();

  // ── 2. Parse request — checkoutId + shipping details only ─────────────
  let checkoutId: string;
  let shippingDetails: Record<string, unknown> | null;

  try {
    const body = await request.json();
    checkoutId = String(body.checkoutId ?? "").trim();
    shippingDetails = body.shippingDetails ?? null;
    // body.userId is deliberately not read here
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId is required." }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // ── 2. Load the pending order — server's record of what was purchased ─
  const { data: pendingOrder, error: pendingErr } = await supabase
    .from("pending_orders")
    .select("*")
    .eq("sumup_checkout_id", checkoutId)
    .single();

  if (pendingErr || !pendingOrder) {
    console.error("[finalize] no pending_order found for checkoutId:", checkoutId, pendingErr?.message);
    return NextResponse.json(
      { error: "No pending order found for this checkout. It may have already been processed or never created." },
      { status: 404 },
    );
  }

  // ── 3. Prevent replay — check if already fulfilled ────────────────────
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("sumup_checkout_id", checkoutId)
    .limit(1)
    .single();

  if (existingOrder) {
    console.log("[finalize] already processed:", checkoutId);
    return NextResponse.json({ paid: true, alreadyProcessed: true });
  }

  console.log("[finalize] verifying payment with SumUp for checkoutId:", checkoutId);

  // ── 4. Verify payment with SumUp server-side ──────────────────────────
  const sumupBase = (process.env.SUMUP_API_BASE?.trim() || "https://api.sumup.com").replace(/\/$/, "");
  const sumupRes = await fetch(`${sumupBase}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });

  const sumupData = await sumupRes.json().catch(() => ({}));
  if (!sumupRes.ok) {
    return NextResponse.json(
      { error: sumupData?.message || "Unable to verify payment." },
      { status: sumupRes.status },
    );
  }

  // ── 5. Verify checkout_reference matches what we created ──────────────
  const sumupReference = String(sumupData?.checkout_reference ?? "");
  if (sumupReference !== pendingOrder.checkout_reference) {
    console.error("[finalize] reference mismatch for checkout", checkoutId);
    return NextResponse.json({ error: "Checkout reference mismatch. Order rejected." }, { status: 400 });
  }

  // ── 6. Verify payment status ──────────────────────────────────────────
  const paymentStatus = String(sumupData?.status ?? "").toUpperCase();
  const isPaid = paymentStatus === "PAID" || paymentStatus === "SUCCESSFUL";
  console.log("[finalize] SumUp status:", paymentStatus, "amount:", sumupData?.amount, "ref:", sumupData?.checkout_reference);

  if (!isPaid) {
    return NextResponse.json({ paid: false });
  }

  // ── 7. Verify amount and currency match what the server calculated ─────
  const sumupAmount = Number(sumupData?.amount ?? 0);
  const sumupCurrency = String(sumupData?.currency ?? "").toUpperCase();
  const expectedAmount = Number(pendingOrder.expected_amount);
  const expectedCurrency = String(pendingOrder.expected_currency ?? "GBP").toUpperCase();

  if (Math.abs(sumupAmount - expectedAmount) > AMOUNT_TOLERANCE) {
    console.error("[finalize] amount mismatch for checkout", checkoutId);
    return NextResponse.json({ error: "Payment amount mismatch. Order rejected." }, { status: 400 });
  }

  if (sumupCurrency !== expectedCurrency) {
    console.error("[finalize] currency mismatch for checkout", checkoutId);
    return NextResponse.json({ error: "Payment currency mismatch. Order rejected." }, { status: 400 });
  }

  // ── 8. Fulfil order atomically via PostgreSQL RPC ────────────────────
  // fulfil_order_items runs inside a single transaction with FOR UPDATE
  // SKIP LOCKED — two concurrent calls cannot claim the same card_copy.
  const items: { cardId: string; playerName: string; quantity: number; price: number }[] = pendingOrder.items;

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "fulfil_order_items",
    { p_items: items },
  );

  if (rpcError) {
    // INSUFFICIENT_STOCK is raised by the function when copies are unavailable
    const isStock = rpcError.message?.includes("INSUFFICIENT_STOCK");
    const cardName = isStock ? rpcError.message.split(":")[1] ?? "a card" : null;
    console.error("[finalize] rpc error:", rpcError.message);
    return NextResponse.json(
      { error: isStock
          ? `Sorry, ${cardName} is no longer available — another order may have just claimed the last copy.`
          : "Failed to fulfil order. Please contact support."
      },
      { status: isStock ? 409 : 500 },
    );
  }

  // rpcResult is the jsonb array returned by the function
  const fulfilledItems: {
    cardId: string; playerName: string; quantity: number;
    price: number; owner: string | null; copyIds: string[];
  }[] = Array.isArray(rpcResult) ? rpcResult : [];

  const itemsWithMeta = fulfilledItems.map(i => ({
    cardId: i.cardId,
    playerName: i.playerName,
    quantity: i.quantity,
    price: i.price,
    copyIds: i.copyIds,
  }));

  const failed: string[] = [];

  // ── 9. Save fulfilled order ───────────────────────────────────────────
  const subtotal = itemsWithMeta.reduce((sum, i) => sum + Number(i.price ?? 0) * i.quantity, 0);
  const shippingCost = Number(pendingOrder.shipping_cost ?? 0);
  const total = Number((subtotal + shippingCost).toFixed(2));

  const shippingName    = shippingDetails?.fullName    ? String(shippingDetails.fullName)    : null;
  const shippingEmail   = shippingDetails?.email       ? String(shippingDetails.email)       : null;
  const shippingAddr1   = shippingDetails?.addressLine1 ? String(shippingDetails.addressLine1) : null;
  const shippingAddr2   = shippingDetails?.addressLine2 ? String(shippingDetails.addressLine2) : null;
  const shippingCity    = shippingDetails?.city        ? String(shippingDetails.city)        : null;
  const shippingPost    = shippingDetails?.postcode    ? String(shippingDetails.postcode)    : null;

  const { data: savedOrder, error: orderInsertError } = await supabase.from("orders").insert({
    sumup_checkout_id: checkoutId,
    checkout_reference: pendingOrder.checkout_reference,
    status: "paid",
    items: itemsWithMeta,
    subtotal: Number(subtotal.toFixed(2)),
    shipping_cost: Number(shippingCost.toFixed(2)),
    total,
    shipping_name: shippingName,
    shipping_email: shippingEmail,
    shipping_address_line1: shippingAddr1,
    shipping_address_line2: shippingAddr2,
    shipping_city: shippingCity,
    shipping_postcode: shippingPost,
    shipping_method: pendingOrder.shipping_rate_label ?? null,
    user_id: userId ?? null,
  }).select("id").single();

  // Stamp order_id on sold copies
  if (orderInsertError) {
    console.error("[finalize] order insert failed:", orderInsertError.message, orderInsertError.code);
  } else {
    console.log("[finalize] order saved successfully, id:", (savedOrder as any)?.id);
  }
  if (savedOrder) {
    const soldCopyIds = itemsWithMeta.flatMap((i: any) => i.copyIds ?? []);
    if (soldCopyIds.length > 0) {
      await supabase.from("card_copies").update({ order_id: (savedOrder as any).id }).in("id", soldCopyIds);
    }
    await supabase.from("pending_orders").delete().eq("sumup_checkout_id", checkoutId);
  }

  // ── 10. Send emails ───────────────────────────────────────────────────
  const shippingForEmail = {
    fullName: shippingName ?? undefined,
    email: shippingEmail ?? undefined,
    addressLine1: shippingAddr1 ?? undefined,
    addressLine2: shippingAddr2 ?? undefined,
    city: shippingCity ?? undefined,
    postcode: shippingPost ?? undefined,
    shippingRate: pendingOrder.shipping_rate_label
      ? { id: pendingOrder.shipping_rate_id, label: pendingOrder.shipping_rate_label, price: shippingCost }
      : undefined,
  };

  const emailResults = await Promise.allSettled([
    sendOrderConfirmation(itemsWithMeta, shippingForEmail, total),
    sendAdminOrderAlert(itemsWithMeta, shippingForEmail, total),
  ]);
  const emailStatuses = emailResults.map(r => r.status);
  console.log("[finalize] emails sent:", emailStatuses);

  if (failed.length > 0) {
    return NextResponse.json(
      { paid: true, error: `Payment confirmed but some stock failed to update: ${failed.join(", ")}.` },
      { status: 207 },
    );
  }

  return NextResponse.json({ paid: true, items: itemsWithMeta.map(i => ({ playerName: i.playerName, quantity: i.quantity, price: i.price })), total });
}
