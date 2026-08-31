import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase, getUserIdFromRequest } from "@/lib/supabase/server";
import { sendOrderConfirmation, sendAdminOrderAlert } from "@/lib/email";
import { rejectForbiddenOrigin } from "@/lib/api/origin";
import { limiters, getIp, checkDualLimit } from "@/lib/api/ratelimit";

// Tolerance for floating-point amount comparison (£0.01)
const AMOUNT_TOLERANCE = 0.01;

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const userId = await getUserIdFromRequest(request);
  const limited = await checkDualLimit(limiters.finalize, ip, userId);
  if (limited) return limited;

  const forbidden = rejectForbiddenOrigin(request);
  if (forbidden) return forbidden;

  const token = process.env.SUMUP_API_KEY?.trim();

  // ── 1. Parse request ──────────────────────────────────────────────────
  let checkoutId: string;
  let shippingDetails: Record<string, unknown> | null;

  try {
    const body = await request.json();
    checkoutId = String(body.checkoutId ?? "").trim();
    shippingDetails = body.shippingDetails ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId is required." }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // ── 2. Load pending order ─────────────────────────────────────────────
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

  // ── 3. Prevent replay ─────────────────────────────────────────────────
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

  // ── 4. Verify payment with SumUp ──────────────────────────────────────
  const sumupBase = (process.env.SUMUP_API_BASE?.trim() || "https://api.sumup.com").replace(/\/$/, "");
  const sumupRes = await fetch(`${sumupBase}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });

  const sumupData = await sumupRes.json().catch(() => ({}));
  if (!sumupRes.ok) {
    console.error("[finalize] SumUp fetch failed:", sumupRes.status, sumupData?.message);
    return NextResponse.json(
      { error: sumupData?.message || "Unable to verify payment." },
      { status: sumupRes.status },
    );
  }

  // ── 5. Verify checkout_reference ─────────────────────────────────────
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

  // ── 7. Verify amount and currency ─────────────────────────────────────
  const sumupAmount = Number(sumupData?.amount ?? 0);
  const sumupCurrency = String(sumupData?.currency ?? "").toUpperCase();
  const expectedAmount = Number(pendingOrder.expected_amount);
  const expectedCurrency = String(pendingOrder.expected_currency ?? "GBP").toUpperCase();

  if (Math.abs(sumupAmount - expectedAmount) > AMOUNT_TOLERANCE) {
    console.error("[finalize] amount mismatch:", sumupAmount, "vs expected:", expectedAmount);
    return NextResponse.json({ error: "Payment amount mismatch. Order rejected." }, { status: 400 });
  }

  if (sumupCurrency !== expectedCurrency) {
    console.error("[finalize] currency mismatch:", sumupCurrency, "vs expected:", expectedCurrency);
    return NextResponse.json({ error: "Payment currency mismatch. Order rejected." }, { status: 400 });
  }

  // ── 8. Decrement stock directly on each card ──────────────────────────
  // No card_copies dependency — if the card has stock it can be purchased.
  const items: { cardId: string; playerName: string; quantity: number; price: number }[] = pendingOrder.items;

  for (const item of items) {
    const { data: card, error: cardErr } = await supabase
      .from("cards")
      .select("id, stock, status")
      .eq("id", item.cardId)
      .single();

    if (cardErr || !card) {
      console.error("[finalize] card not found:", item.cardId, cardErr?.message);
      return NextResponse.json(
        { error: `Card "${item.playerName}" could not be found.` },
        { status: 409 },
      );
    }

    const newStock = Math.max(0, Number(card.stock) - item.quantity);
    const newStatus = newStock === 0 ? "draft" : card.status;

    const { error: updateErr } = await supabase
      .from("cards")
      .update({ stock: newStock, status: newStatus })
      .eq("id", item.cardId);

    if (updateErr) {
      console.error("[finalize] stock update failed for:", item.playerName, updateErr.message);
    } else {
      console.log("[finalize] stock updated:", item.playerName, "new stock:", newStock);
    }
  }

  // ── 9. Build shipping fields — use pending order (saved at checkout time) ──
  const shippingName   = pendingOrder.shipping_name   ?? (shippingDetails?.fullName     ? String(shippingDetails.fullName)     : null);
  const shippingEmail  = pendingOrder.shipping_email  ?? (shippingDetails?.email        ? String(shippingDetails.email)        : null);
  const shippingAddr1  = pendingOrder.shipping_address_line1 ?? (shippingDetails?.addressLine1 ? String(shippingDetails.addressLine1) : null);
  const shippingAddr2  = pendingOrder.shipping_address_line2 ?? (shippingDetails?.addressLine2 ? String(shippingDetails.addressLine2) : null);
  const shippingCity   = pendingOrder.shipping_city   ?? (shippingDetails?.city         ? String(shippingDetails.city)         : null);
  const shippingPost   = pendingOrder.shipping_postcode ?? (shippingDetails?.postcode   ? String(shippingDetails.postcode)     : null);

  const subtotal    = items.reduce((sum, i) => sum + Number(i.price ?? 0) * i.quantity, 0);
  const shippingCost = Number(pendingOrder.shipping_cost ?? 0);
  const total       = Number((subtotal + shippingCost).toFixed(2));

  // ── 10. Save order ────────────────────────────────────────────────────
  const { data: savedOrder, error: orderInsertError } = await supabase
    .from("orders")
    .insert({
      sumup_checkout_id: checkoutId,
      checkout_reference: pendingOrder.checkout_reference,
      status: "paid",
      items,
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
    })
    .select("id")
    .single();

  if (orderInsertError) {
    console.error("[finalize] order insert failed:", orderInsertError.message, orderInsertError.code);
    return NextResponse.json(
      { error: "Payment confirmed but order could not be saved. Please contact support." },
      { status: 500 },
    );
  }

  console.log("[finalize] order saved successfully, id:", (savedOrder as any)?.id);

  // ── 11. Clean up pending order ────────────────────────────────────────
  await supabase.from("pending_orders").delete().eq("sumup_checkout_id", checkoutId);

  // ── 12. Send emails ───────────────────────────────────────────────────
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
    sendOrderConfirmation(items, shippingForEmail, total),
    sendAdminOrderAlert(items, shippingForEmail, total),
  ]);
  console.log("[finalize] emails:", emailResults.map(r => r.status));

  return NextResponse.json({
    paid: true,
    items: items.map(i => ({ playerName: i.playerName, quantity: i.quantity, price: i.price })),
    total,
  });
}
