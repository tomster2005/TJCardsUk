"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { completeSale, isCompletingSale, saleError, saleSuccess } = useCart();
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "failed">("checking");
  const [message, setMessage] = useState("Checking your SumUp payment status...");

  const checkoutId = useMemo(() => {
    return (
      searchParams.get("checkoutId") ||
      searchParams.get("checkout_id") ||
      (typeof window !== "undefined" ? window.sessionStorage.getItem("collectra_sumup_checkout_id") : null)
    );
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAndFinalize() {
      if (!checkoutId) {
        setStatus("pending");
        setMessage("We could not find a checkout ID. If you completed payment, please contact support.");
        return;
      }

      const response = await fetch(`/api/sumup/confirm?checkoutId=${encodeURIComponent(checkoutId)}`, {
        method: "GET",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!cancelled) {
          setStatus("failed");
          setMessage(payload?.error || "Unable to confirm payment status with SumUp.");
        }
        return;
      }

      const paymentStatus = String(payload?.status || "").toUpperCase();
      const isPaid = paymentStatus === "PAID" || paymentStatus === "SUCCESSFUL";

      if (!isPaid) {
        if (!cancelled) {
          setStatus("pending");
          setMessage(`Payment is currently ${paymentStatus || "pending"}. We will only finalize stock once payment is complete.`);
        }
        return;
      }

      await completeSale();
      if (cancelled) return;

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("collectra_sumup_checkout_id");
      }

      if (saleError) {
        setStatus("failed");
        setMessage(saleError);
        return;
      }

      setStatus("paid");
      setMessage("Payment confirmed and inventory updated.");
    }

    void verifyAndFinalize();

    return () => {
      cancelled = true;
    };
  }, [checkoutId, completeSale, saleError]);

  return (
    <Layout>
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-300/55 bg-white/92 p-10 shadow-[0_20px_48px_rgba(15,23,42,0.09)]">
        <p className="text-xs uppercase tracking-[0.34em] text-amber-700">Checkout</p>
        <h1 className="mt-2 text-4xl font-semibold text-zinc-900">SumUp payment result</h1>
        <p className="mt-4 text-zinc-700">{message}</p>

        {saleSuccess ? (
          <p className="mt-4 rounded-xl border border-emerald-300/60 bg-emerald-100/80 p-3 text-sm text-emerald-900">{saleSuccess}</p>
        ) : null}

        {saleError ? (
          <p className="mt-4 rounded-xl border border-rose-300/60 bg-rose-100/80 p-3 text-sm text-rose-900">{saleError}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalogue" className="rounded-full border border-amber-400/40 bg-amber-100/90 px-5 py-2.5 text-sm font-semibold text-amber-900">
            Back to catalogue
          </Link>
          <Link href="/cart" className="rounded-full border border-slate-300/70 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800">
            Return to cart
          </Link>
        </div>

        {(status === "checking" || isCompletingSale) ? (
          <p className="mt-4 text-sm text-zinc-500">Finalizing your order...</p>
        ) : null}
      </section>
    </Layout>
  );
}
