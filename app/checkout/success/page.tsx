"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatGBP } from "@/lib/currency";
import getBrowserSupabase from "@/lib/supabase/client";

type CartItem = { cardId: string; playerName: string; quantity: number; price?: number };
type ShippingDetails = {
  fullName?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  shippingRate?: { id: string; label: string; price: number };
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useAuth();

  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "failed">("checking");
  const [message, setMessage] = useState("Checking your payment status...");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails | null>(null);
  const [verifiedTotal, setVerifiedTotal] = useState<number | null>(null);

  const checkoutId = useMemo(() => {
    return (
      searchParams.get("checkoutId") ||
      searchParams.get("checkout_id") ||
      (typeof window !== "undefined" ? window.sessionStorage.getItem("collectra_sumup_checkout_id") : null)
    );
  }, [searchParams]);

  const checkoutRef = useMemo(() => searchParams.get("ref"), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAndFinalize() {
      let resolvedCheckoutId = checkoutId;

      // If no checkoutId in sessionStorage (common on mobile after redirect),
      // look it up from pending_orders using the checkout_reference in the URL
      if (!resolvedCheckoutId && checkoutRef) {
        const supabase = getBrowserSupabase();
        const { data: pending } = await supabase!.from("pending_orders")
          .select("sumup_checkout_id")
          .eq("checkout_reference", checkoutRef)
          .single();
        resolvedCheckoutId = pending?.sumup_checkout_id ?? null;
      }

      if (!resolvedCheckoutId) {
        setStatus("pending");
        setMessage("We could not find a checkout ID. If you completed payment, please contact support.");
        return;
      }

      // Only send shipping details (for display + email).
      // User identity is resolved server-side from the Authorization header.
      // body.userId is not sent — the server validates the JWT directly.
      const rawShipping = typeof window !== "undefined" ? window.sessionStorage.getItem("collectra_sumup_shipping") : null;
      const shipping: ShippingDetails | null = rawShipping ? JSON.parse(rawShipping) : null;

      // Attach the session access token so the server can verify identity.
      const supabase = getBrowserSupabase();
      const { data: { session } } = await (supabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } }));
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const response = await fetch("/api/sumup/finalize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          checkoutId: resolvedCheckoutId,
          shippingDetails: shipping,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (cancelled) return;

      if (!response.ok && response.status !== 207) {
        setStatus("failed");
        setMessage(payload?.error || "Unable to confirm payment status.");
        return;
      }

      if (!payload.paid) {
        setStatus("pending");
        setMessage(`Payment is currently pending. Stock will update once payment completes.`);
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("collectra_sumup_checkout_id");
        window.sessionStorage.removeItem("collectra_sumup_cart");
        window.sessionStorage.removeItem("collectra_sumup_shipping");
      }

      setOrderItems(payload.items ?? []);
      setShippingDetails(shipping);
      setVerifiedTotal(payload.total ?? null);
      clearCart();

      if (payload.error) {
        setStatus("failed");
        setErrorDetail(payload.error);
        setMessage("Payment confirmed but there was an issue updating stock.");
        return;
      }

      setStatus("paid");
      setMessage("Payment confirmed — your order is on its way!");
    }

    void verifyAndFinalize();
    return () => { cancelled = true; };
  }, [checkoutId, checkoutRef, user?.id]);

  const subtotal = orderItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const shippingCost = shippingDetails?.shippingRate?.price ?? 0;
  const total = verifiedTotal ?? (subtotal + shippingCost);

  return (
    <section className="mx-auto max-w-2xl space-y-6">

      {/* Status banner */}
      <div className={`rounded-[2rem] border p-8 shadow-[0_20px_48px_rgba(0,0,0,0.08)] ${
        status === "paid" ? "border-emerald-300/60 bg-emerald-50" :
        status === "failed" ? "border-rose-200 bg-rose-50" :
        "border-[rgba(200,155,60,0.2)] bg-white"
      }`}>
        <p className="text-xs uppercase tracking-[0.34em] text-[#92400e]">Order Confirmation</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          {status === "paid" ? "Thank you! 🎉" : status === "failed" ? "Something went wrong" : "Checking payment..."}
        </h1>
        <p className="mt-2 text-zinc-600">{message}</p>
        {errorDetail && <p className="mt-3 text-sm text-rose-700">{errorDetail}</p>}
      </div>

      {/* Order details — only shown on success */}
      {status === "paid" && orderItems.length > 0 && (
        <div className="rounded-[2rem] border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Items Ordered</p>
          <ul className="mt-4 divide-y divide-[rgba(0,0,0,0.06)]">
            {orderItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{item.playerName}</p>
                  <p className="text-[12px] text-zinc-400">Qty: {item.quantity}</p>
                </div>
                {item.price != null && (
                  <p className="text-sm font-bold text-zinc-800">{formatGBP(item.price * item.quantity)}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-[rgba(0,0,0,0.06)] pt-4 text-[13px] text-zinc-600">
            {subtotal > 0 && (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900">{formatGBP(subtotal)}</span>
              </div>
            )}
            {shippingCost > 0 && (
              <div className="flex justify-between">
                <span>Shipping {shippingDetails?.shippingRate?.label ? `(${shippingDetails.shippingRate.label})` : ""}</span>
                <span className="font-semibold text-zinc-900">{formatGBP(shippingCost)}</span>
              </div>
            )}
            {total > 0 && (
              <div className="flex justify-between border-t border-[rgba(0,0,0,0.06)] pt-2 text-base">
                <span className="font-black text-zinc-900">Total paid</span>
                <span className="font-black text-zinc-900">{formatGBP(total)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping address — only shown on success */}
      {status === "paid" && shippingDetails?.fullName && (
        <div className="rounded-[2rem] border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Shipping To</p>
          <div className="mt-3 text-sm text-zinc-700 space-y-0.5">
            <p className="font-semibold text-zinc-900">{shippingDetails.fullName}</p>
            {shippingDetails.addressLine1 && <p>{shippingDetails.addressLine1}</p>}
            {shippingDetails.addressLine2 && <p>{shippingDetails.addressLine2}</p>}
            {shippingDetails.city && <p>{shippingDetails.city}</p>}
            {shippingDetails.postcode && <p>{shippingDetails.postcode}</p>}
            {shippingDetails.email && <p className="mt-2 text-zinc-400">{shippingDetails.email}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/catalogue" className="btn-gold rounded-full px-5 py-2.5 text-sm font-semibold">
          Back to catalogue
        </Link>
        <Link href="/dashboard" className="rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-[rgba(0,0,0,0.03)]">
          My vault
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="mx-auto max-w-2xl rounded-[2rem] border border-[rgba(0,0,0,0.08)] bg-white p-10 text-zinc-500">Loading...</div>}>
        <CheckoutSuccessContent />
      </Suspense>
    </Layout>
  );
}
