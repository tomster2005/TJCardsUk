import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase, getUserIdFromRequest } from "@/lib/supabase/server";
import { rejectForbiddenOrigin, getCanonicalBaseUrl } from "@/lib/api/origin";
import { limiters, getIp, checkDualLimit } from "@/lib/api/ratelimit";

// Shipping rates — single source of truth on the server.
// Must stay in sync with the display labels in cart/page.tsx.
const SHIPPING_RATES: Record<string, { label: string; price: number }> = {
  tracked48:   { label: "Royal Mail Tracked 48", price: 2.85 },
  secondclass: { label: "Royal Mail 2nd Class",  price: 0.91 },
};

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  // Resolve user identity before rate limiting so we can apply a per-user
  // bucket in addition to the per-IP bucket.
  const userId = await getUserIdFromRequest(request);
  const limited = await checkDualLimit(limiters.checkout, ip, userId);
  if (limited) return limited;

  const forbidden = rejectForbiddenOrigin(request);
  if (forbidden) return forbidden;

  const token = process.env.SUMUP_API_KEY?.trim();
  const merchantCode = process.env.SUMUP_MERCHANT_CODE?.trim();
  const payToEmail = process.env.SUMUP_PAY_TO_EMAIL?.trim();

  if (!token || (!merchantCode && !payToEmail)) {
    return NextResponse.json({ error: "Missing SumUp configuration." }, { status: 500 });
  }

  // ── 1. Parse request — accept only identifiers, never prices ──────────
  let items: { cardId: string; quantity: number }[];
  let shippingRateId: string;
  let discountCode: string | null;
  let shipping: { fullName?: string; email?: string; addressLine1?: string; addressLine2?: string; city?: string; postcode?: string } | null;

  try {
    const body = await request.json();
    items = Array.isArray(body.items) ? body.items : [];
    shippingRateId = String(body.shippingRateId ?? "").trim();
    discountCode = body.discountCode ? String(body.discountCode).trim().toUpperCase() : null;
    shipping = body.shipping ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "No items provided." }, { status: 400 });
  }

  const shippingRate = SHIPPING_RATES[shippingRateId];
  if (!shippingRate) {
    return NextResponse.json({ error: "Invalid shipping option." }, { status: 400 });
  }

  // ── 2. Fetch authoritative prices + stock from Supabase ───────────────
  const supabase = createServiceSupabase();
  const cardIds = items.map(i => i.cardId);

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("id, price, stock, player, card_number, set_name, storage_location, status")
    .in("id", cardIds);

  if (cardsError || !cards) {
    return NextResponse.json({ error: "Failed to load card data." }, { status: 500 });
  }

  // ── 3. Validate availability and calculate server-side subtotal ────────
  const unavailable: string[] = [];
  let subtotal = 0;

  for (const item of items) {
    const card = cards.find(c => c.id === item.cardId);
    if (!card || card.stock < item.quantity || card.status === "draft") {
      unavailable.push(card?.player ?? item.cardId);
      continue;
    }
    subtotal += Number(card.price) * item.quantity;
  }

  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: `The following cards are no longer available: ${unavailable.join(", ")}.` },
      { status: 409 },
    );
  }

  // ── 4. Validate discount code server-side ─────────────────────────────
  let freeShipping = false;
  if (discountCode) {
    const { data: discount } = await supabase
      .from("discount_codes")
      .select("type")
      .eq("code", discountCode)
      .eq("active", true)
      .single();
    if (discount?.type === "free_shipping") freeShipping = true;
    // Unknown/inactive codes are silently ignored (don't block checkout)
  }

  // ── 5. Calculate final total — server is sole authority ───────────────
  const shippingCost = freeShipping ? 0 : shippingRate.price;
  const total = Number((subtotal + shippingCost).toFixed(2));

  if (total <= 0) {
    return NextResponse.json({ error: "Order total must be greater than 0." }, { status: 400 });
  }

  // ── 6. Create SumUp checkout with server-calculated total ─────────────
  const baseUrl = getCanonicalBaseUrl();
  const checkoutReference = `collectra-${Date.now()}`;
  const sumupBase = (process.env.SUMUP_API_BASE?.trim() || "https://api.sumup.com").replace(/\/$/, "");
  const successBase = `${baseUrl}/checkout/success`;
  const successWithRef = `${successBase}?ref=${encodeURIComponent(checkoutReference)}`;

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const sumupPayload = {
    checkout_reference: checkoutReference,
    amount: total,
    currency: "GBP",
    merchant_code: merchantCode,
    pay_to_email: payToEmail,
    description: `Collectra order (${itemCount} item${itemCount !== 1 ? "s" : ""})`,
    hosted_checkout: { enabled: true },
    redirect_url: successWithRef,
    return_url: successWithRef,
  };

  const sumupRes = await fetch(`${sumupBase}/v0.1/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(sumupPayload),
    cache: "no-store",
  });

  const sumupData = await sumupRes.json().catch(() => ({}));
  if (!sumupRes.ok) {
    return NextResponse.json(
      { error: sumupData?.message || "Unable to create SumUp checkout." },
      { status: sumupRes.status },
    );
  }

  const checkoutId: string = sumupData.id;

  // ── 7. Persist pending order — server is now the authority for items/total ──
  // finalize will load items + expected values from here, not from the browser.
  const pendingItems = items.map(i => {
    const card = cards.find(c => c.id === i.cardId)!;
    return {
      cardId: i.cardId,
      playerName: card.player,
      cardNumber: card.card_number ?? null,
      setName: card.set_name ?? null,
      storageLocation: card.storage_location ?? null,
      quantity: i.quantity,
      price: Number(card.price),
    };
  });

  const { error: pendingInsertError } = await supabase.from("pending_orders").insert({
    sumup_checkout_id: checkoutId,
    checkout_reference: checkoutReference,
    expected_amount: total,
    expected_currency: "GBP",
    items: pendingItems,
    shipping_rate_id: shippingRateId,
    shipping_rate_label: shippingRate.label,
    shipping_cost: shippingCost,
    discount_code: discountCode ?? null,
    shipping_name: shipping?.fullName ?? null,
    shipping_email: shipping?.email ?? null,
    shipping_address_line1: shipping?.addressLine1 ?? null,
    shipping_address_line2: shipping?.addressLine2 ?? null,
    shipping_city: shipping?.city ?? null,
    shipping_postcode: shipping?.postcode ?? null,
  });

  if (pendingInsertError) {
    console.error("[checkout] failed to insert pending_order:", pendingInsertError.message, pendingInsertError.code);
  } else {
    console.log("[checkout] pending_order saved:", checkoutReference, "checkoutId:", checkoutId);
  }

  return NextResponse.json({
    checkoutId,
    checkoutUrl: sumupData.hosted_checkout_url ?? null,
  });
}
