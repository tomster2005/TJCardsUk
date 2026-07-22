import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { sendOrderConfirmation, sendAdminOrderAlert } from "@/lib/email";

type CartItem = {
  cardId: string;
  playerName: string;
  quantity: number;
  price?: number;
  owner?: string | null;
};

type ShippingRate = {
  id: string;
  label: string;
  price: number;
};

type ShippingDetails = {
  fullName?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  shippingRate?: ShippingRate;
};

export async function POST(request: NextRequest) {
  const token = process.env.SUMUP_API_KEY?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing SUMUP_API_KEY." }, { status: 500 });
  }

  let checkoutId: string;
  let items: CartItem[];
  let shippingDetails: ShippingDetails | null;
  let userId: string | null;

  try {
    const body = await request.json();
    checkoutId = String(body.checkoutId ?? "").trim();
    items = Array.isArray(body.items) ? body.items : [];
    shippingDetails = body.shippingDetails ?? null;
    userId = body.userId ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId is required." }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "No items provided." }, { status: 400 });
  }

  // Verify payment with SumUp server-side
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

  const paymentStatus = String(sumupData?.status || "").toUpperCase();
  const isPaid = paymentStatus === "PAID" || paymentStatus === "SUCCESSFUL";

  if (!isPaid) {
    return NextResponse.json({ status: paymentStatus, paid: false });
  }

  const supabase = createServiceSupabase();

  // Update stock server-side using FIFO card_copies
  const failed: string[] = [];
  const itemsWithPrices: CartItem[] = [];

  for (const item of items) {
    const { data: card, error } = await supabase
      .from("cards")
      .select("id, stock, status, price, player")
      .eq("id", item.cardId)
      .single();

    if (error || !card) {
      failed.push(item.playerName);
      itemsWithPrices.push(item);
      continue;
    }

    // Fetch oldest unsold copies (FIFO) for the quantity purchased
    const { data: copies, error: copiesError } = await supabase
      .from("card_copies")
      .select("id, owner")
      .eq("card_id", item.cardId)
      .eq("sold", false)
      .order("created_at", { ascending: true })
      .limit(item.quantity);

    if (copiesError || !copies || copies.length === 0) {
      failed.push(item.playerName);
      itemsWithPrices.push(item);
      continue;
    }

    // Mark copies as sold
    const copyIds = copies.map((c: any) => c.id);
    const { error: markError } = await supabase
      .from("card_copies")
      .update({ sold: true })
      .in("id", copyIds);

    if (markError) { failed.push(item.playerName); }

    // Owner from the first (oldest) copy sold
    const owner = (copies[0] as any).owner ?? null;
    itemsWithPrices.push({ ...item, price: Number((card as any).price ?? 0), owner, _copyIds: copyIds } as any);

    // Update stock count and status on the card row
    const nextStock = Math.max(0, Number((card as any).stock ?? 0) - copies.length);
    const nextStatus = nextStock === 0 ? "draft" : (card as any).status;
    await supabase.from("cards").update({ stock: nextStock, status: nextStatus }).eq("id", item.cardId);
  }

  // Save order
  const subtotal = itemsWithPrices.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const shippingCost = shippingDetails?.shippingRate?.price ?? 0;
  const total = Number(sumupData?.amount ?? subtotal + shippingCost);

  const { data: savedOrder } = await supabase.from("orders").insert({
    sumup_checkout_id: checkoutId,
    status: "paid",
    items: itemsWithPrices,
    subtotal: Number(subtotal.toFixed(2)),
    shipping_cost: Number(shippingCost.toFixed(2)),
    total: Number(total.toFixed(2)),
    shipping_name: shippingDetails?.fullName ?? null,
    shipping_email: shippingDetails?.email ?? null,
    shipping_address_line1: shippingDetails?.addressLine1 ?? null,
    shipping_address_line2: shippingDetails?.addressLine2 ?? null,
    shipping_city: shippingDetails?.city ?? null,
    shipping_postcode: shippingDetails?.postcode ?? null,
    shipping_method: shippingDetails?.shippingRate?.label ?? null,
    user_id: userId ?? null,
  }).select("id").single();

  // Stamp order_id on sold copies
  if (savedOrder) {
    const soldCopyIds = itemsWithPrices.flatMap((i: any) => i._copyIds ?? []);
    if (soldCopyIds.length > 0) {
      await supabase.from("card_copies").update({ order_id: (savedOrder as any).id }).in("id", soldCopyIds);
    }
  }

  // Send emails (non-blocking — don't fail the order if email fails)
  const emailResults = await Promise.allSettled([
    sendOrderConfirmation(itemsWithPrices, shippingDetails ?? {}, Number(total.toFixed(2))),
    sendAdminOrderAlert(itemsWithPrices, shippingDetails ?? {}, Number(total.toFixed(2))),
  ]);
  console.log("[finalize] email results:", JSON.stringify(emailResults));
  console.log("[finalize] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
  console.log("[finalize] shipping email:", shippingDetails?.email);

  if (failed.length > 0) {
    return NextResponse.json(
      { paid: true, error: `Payment confirmed but some stock failed to update: ${failed.join(", ")}.`, items: itemsWithPrices },
      { status: 207 },
    );
  }

  return NextResponse.json({ paid: true, status: paymentStatus, items: itemsWithPrices, total: Number(total.toFixed(2)) });
}
