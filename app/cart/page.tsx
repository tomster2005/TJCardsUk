"use client";

import Link from "next/link";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
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
      headers: { "Content-Type": "application/json" },
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
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-up">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">Cart</span>
            <h1 className="mt-1 text-3xl font-black text-zinc-900 font-display">Your Order</h1>
            <p className="mt-0.5 text-[13px] text-zinc-500">
              {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""} ready for checkout` : "Nothing in your cart yet"}
            </p>
          </div>

          {itemCount > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Subtotal</p>
                <p className="text-2xl font-black text-zinc-900">{formatGBP(subtotal)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Browse the vault and add some cards to your cart. Your next grail is waiting."
            actions={[
              { label: "Browse catalogue", href: "/catalogue", primary: true },
              { label: "Back to dashboard", href: "/dashboard" },
            ]}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">

            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: "rgba(200,155,60,0.06)", border: "1px solid rgba(200,155,60,0.15)" }}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={`${item.playerName} #${item.cardNumber}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-2xl opacity-20">🃏</div>
                        )}
                      </div>

                      <div>
                        <p className="text-[15px] font-black text-zinc-900">{item.playerName}</p>
                        <p className="text-[12px] text-zinc-500">Card #{item.cardNumber}</p>
                        <p className="mt-1 text-[13px] font-bold text-[var(--gold-600)]">{formatGBP(item.price)} each</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Line total</p>
                      <p className="mt-0.5 text-xl font-black text-zinc-900">{formatGBP(item.price * item.quantity)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "rgba(200,155,60,0.1)", background: "rgba(200,155,60,0.03)" }}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.cardId)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-zinc-600 transition hover:bg-white"
                        style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-[13px] font-black text-zinc-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.cardId)}
                        disabled={typeof item.availableQuantity === "number" && item.quantity >= item.availableQuantity}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-zinc-600 transition hover:bg-white disabled:opacity-40"
                        style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cardId)}
                      className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}

              <div className="flex justify-between gap-3 pt-2">
                <Link
                  href="/catalogue"
                  className="rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-2.5 text-[13px] font-semibold text-zinc-600 transition hover:text-zinc-900"
                >
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-zinc-400 transition hover:text-rose-600"
                >
                  Clear cart
                </button>
              </div>
            </div>

            {/* Order summary */}
            <aside className="h-fit rounded-2xl xl:sticky xl:top-24" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Order Summary</p>

                <dl className="mt-4 space-y-3 text-[13px] text-zinc-600">
                  <div className="flex items-center justify-between">
                    <dt>Subtotal</dt>
                    <dd className="font-bold text-zinc-900">{formatGBP(subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Tax</dt>
                    <dd className="font-bold text-zinc-900">{formatGBP(estimatedTax)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Shipping</dt>
                    <dd className="text-[12px] text-zinc-400">At checkout</dd>
                  </div>
                  <div className="border-t" style={{ borderColor: "rgba(200,155,60,0.15)" }} />
                  <div className="flex items-center justify-between text-base">
                    <dt className="font-black text-zinc-900">Total</dt>
                    <dd className="font-black text-zinc-900">{formatGBP(grandTotal)}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => void handleStartSumUpCheckout()}
                  disabled={isStartingCheckout}
                  className="btn-gold mt-5 w-full rounded-full py-3 text-[13px] font-bold disabled:opacity-50"
                >
                  {isStartingCheckout ? "Opening SumUp..." : "Checkout"}
                </button>

                {checkoutError && (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700 border border-rose-200">{checkoutError}</p>
                )}

                <p className="mt-3 text-[11px] text-zinc-400 text-center">
                  Secure payment via SumUp · Prices in GBP
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
