"use client";

import Link from "next/link";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";

export default function CartPage() {
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const {
    items,
    itemCount,
    subtotal,
    estimatedTax,
    grandTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  async function handleStartSumUpCheckout() {
    setIsStartingCheckout(true);
    setCheckoutError(null);

    const response = await fetch("/api/sumup/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: grandTotal,
        currency: "GBP",
        description: `Collectra order (${itemCount} items)`,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setCheckoutError(payload?.error || "Unable to start SumUp checkout.");
      setIsStartingCheckout(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("collectra_sumup_checkout_id", String(payload.checkoutId || ""));
      window.location.href = String(payload.checkoutUrl || "/cart");
      return;
    }

    setIsStartingCheckout(false);
  }

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[2rem] p-10 shadow-[0_20px_48px_rgba(15,23,42,0.09)]">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-slate-300/55 bg-gradient-to-r from-white/86 via-[#fcfaf3]/92 to-white/86" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.34em] text-amber-700">Cart</p>
            <h1 className="text-4xl font-semibold text-zinc-900 sm:text-5xl">Review your lineup</h1>
            <p className="max-w-2xl text-zinc-600">
              A polished pre-checkout cart experience. Adjust quantities, remove cards, and review your estimated total before payments go live.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-300/60 bg-white/90 px-5 py-4 text-right shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Items</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{itemCount}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">Subtotal</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{formatGBP(subtotal)}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="relative mt-8 rounded-[1.5rem] border border-slate-300/60 bg-white/85 p-8 text-center">
            <p className="text-lg font-semibold text-zinc-900">Your cart is empty</p>
            <p className="mt-2 text-zinc-600">Browse the catalogue and add cards to get started.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/catalogue"
                className="inline-flex rounded-full border border-amber-400/40 bg-amber-100/90 px-5 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-200/80"
              >
                Browse catalogue
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex rounded-full border border-slate-300/70 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-slate-50"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="animate-page-enter rounded-3xl border border-slate-300/60 bg-white/92 p-5 shadow-[0_12px_26px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-16 overflow-hidden rounded-xl border border-slate-300/70 bg-slate-100">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={`${item.playerName} #${item.cardNumber}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-500">No image</div>
                        )}
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-zinc-900">{item.playerName}</p>
                        <p className="text-sm text-zinc-600">Card #{item.cardNumber}</p>
                        <p className="mt-1 text-sm font-medium text-amber-700">{formatGBP(item.price)} each</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Line total</p>
                      <p className="mt-1 text-xl font-semibold text-zinc-900">{formatGBP(item.price * item.quantity)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.cardId)}
                        className="rounded-full border border-slate-300/80 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="min-w-10 text-center text-sm font-semibold text-zinc-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.cardId)}
                        disabled={typeof item.availableQuantity === "number" && item.quantity >= item.availableQuantity}
                        className="rounded-full border border-slate-300/80 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cardId)}
                      className="rounded-full border border-rose-300/60 bg-rose-100/80 px-3 py-1.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-200/80"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}

              <div className="flex justify-between gap-3">
                <Link
                  href="/catalogue"
                  className="inline-flex rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-slate-50"
                >
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-slate-300/70 bg-slate-100/80 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-slate-200/80"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-3xl border border-slate-300/60 bg-white/94 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.1)] xl:sticky xl:top-24">
              <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Order summary</p>

              <dl className="mt-4 space-y-3 text-sm text-zinc-700">
                <div className="flex items-center justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-zinc-900">{formatGBP(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Tax</dt>
                  <dd className="font-semibold text-zinc-900">{formatGBP(estimatedTax)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-semibold text-zinc-900">Calculated at checkout</dd>
                </div>
                <div className="my-1 border-t border-slate-200" />
                <div className="flex items-center justify-between text-base">
                  <dt className="font-semibold text-zinc-900">Total</dt>
                  <dd className="font-semibold text-amber-700">{formatGBP(grandTotal)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => void handleStartSumUpCheckout()}
                disabled={isStartingCheckout}
                className="mt-5 w-full rounded-full border border-emerald-300/70 bg-emerald-100/90 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200/90 disabled:cursor-not-allowed disabled:opacity-70"
                title="Pay securely with SumUp"
              >
                {isStartingCheckout ? "Opening SumUp..." : "Pay with SumUp"}
              </button>

              {checkoutError ? <p className="mt-3 rounded-xl border border-rose-300/60 bg-rose-100/80 p-2.5 text-xs text-rose-900">{checkoutError}</p> : null}

              <p className="mt-3 text-xs text-zinc-500">
                Prices are in GBP. Tax is 0. Shipping is calculated during checkout after address entry.
              </p>
            </aside>
          </div>
        )}
      </section>
    </Layout>
  );
}
