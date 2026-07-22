"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";

type ShippingDetails = {
  fullName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
};

type ShippingOption = {
  id: string;
  label: string;
  description: string;
  price: number;
};

const BUBBLE_MAILER_G = 7;
const TOPLOADER_CARD_G = 8;
const BARE_CARD_G = 2;
const TOPLOADER_THRESHOLD = 0.99; // cards above this price get a toploader

const TRACKED_48: ShippingOption = {
  id: "tracked48",
  label: "Royal Mail Tracked 48",
  description: "2-3 business days · £75 insurance included",
  price: 2.85,
};

const SECOND_CLASS: ShippingOption = {
  id: "secondclass",
  label: "Royal Mail 2nd Class",
  description: "3-5 business days · No insurance",
  price: 0.85,
};

const EMPTY_SHIPPING: ShippingDetails = {
  fullName: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
};

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-[rgba(200,155,60,0.5)]";
}

function labelClass() {
  return "block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500";
}

export default function CartPage() {
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingDetails>(EMPTY_SHIPPING);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  const {
    items, itemCount, subtotal, grandTotal,
    increaseQuantity, decreaseQuantity, removeFromCart, clearCart,
  } = useCart();

  // Calculate total package weight based on card prices
  const totalWeightG = useMemo(() => {
    const cardsWeight = items.reduce((sum, item) => {
      const perCard = item.price > TOPLOADER_THRESHOLD ? TOPLOADER_CARD_G : BARE_CARD_G;
      return sum + perCard * item.quantity;
    }, 0);
    return cardsWeight + BUBBLE_MAILER_G;
  }, [items]);

  // Determine available shipping options
  const shippingOptions = useMemo((): ShippingOption[] => {
    if (totalWeightG <= 100) return [SECOND_CLASS, TRACKED_48];
    if (totalWeightG <= 1000) return [TRACKED_48];
    return [];
  }, [totalWeightG]);

  const selectedRate = shippingOptions.find((r) => r.id === selectedRateId) ?? null;
  const orderTotal = subtotal + (selectedRate?.price ?? 0);

  function setField(field: keyof ShippingDetails, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  function validateShipping(): string | null {
    if (!shipping.fullName.trim()) return "Full name is required.";
    if (!shipping.email.trim() || !shipping.email.includes("@")) return "A valid email is required.";
    if (!shipping.addressLine1.trim()) return "Address is required.";
    if (!shipping.city.trim()) return "City is required.";
    if (!shipping.postcode.trim()) return "Postcode is required.";
    if (!selectedRateId) return "Please select a shipping option.";
    return null;
  }

  async function handleStartSumUpCheckout() {
    const validationError = validateShipping();
    if (validationError) {
      setCheckoutError(validationError);
      return;
    }

    setIsStartingCheckout(true);
    setCheckoutError(null);

    const response = await fetch("/api/sumup/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: orderTotal,
        currency: "GBP",
        description: `Collectra order (${itemCount} item${itemCount !== 1 ? "s" : ""})`,
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
      window.sessionStorage.setItem("collectra_sumup_cart", JSON.stringify(items.map((i) => ({ cardId: i.cardId, playerName: i.playerName, quantity: i.quantity }))));
      window.sessionStorage.setItem("collectra_sumup_shipping", JSON.stringify({ ...shipping, shippingRate: selectedRate }));
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
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Subtotal</p>
              <p className="text-2xl font-black text-zinc-900">{formatGBP(subtotal)}</p>
            </div>
          )}
        </div>

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

            {/* Left column */}
            <div className="space-y-4">

              {/* Items */}
              {items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: "rgba(200,155,60,0.06)", border: "1px solid rgba(200,155,60,0.15)" }}>
                        {item.imageUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.imageUrl} alt={`${item.playerName} #${item.cardNumber}`} className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center text-2xl opacity-20">🃏</div>
                        }
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
                      <button type="button" onClick={() => decreaseQuantity(item.cardId)} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-zinc-600 transition hover:bg-white" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                      <span className="min-w-8 text-center text-[13px] font-black text-zinc-900">{item.quantity}</span>
                      <button type="button" onClick={() => increaseQuantity(item.cardId)} disabled={typeof item.availableQuantity === "number" && item.quantity >= item.availableQuantity} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-zinc-600 transition hover:bg-white disabled:opacity-40" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.cardId)} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50">Remove</button>
                  </div>
                </article>
              ))}

              <div className="flex justify-between gap-3 pt-1">
                <Link href="/catalogue" className="rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-2.5 text-[13px] font-semibold text-zinc-600 transition hover:text-zinc-900">Continue shopping</Link>
                <button type="button" onClick={clearCart} className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-zinc-400 transition hover:text-rose-600">Clear cart</button>
              </div>

              {/* Shipping form */}
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Shipping Details</p>
                <p className="mt-1 text-[12px] text-zinc-400">UK delivery only · estimated weight {totalWeightG}g</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={labelClass()}>Full Name</span>
                    <input value={shipping.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="John Smith" className={inputClass()} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelClass()}>Email</span>
                    <input value={shipping.email} onChange={(e) => setField("email", e.target.value)} type="email" placeholder="you@example.com" className={inputClass()} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelClass()}>Address Line 1</span>
                    <input value={shipping.addressLine1} onChange={(e) => setField("addressLine1", e.target.value)} placeholder="123 Example Street" className={inputClass()} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelClass()}>Address Line 2 <span className="normal-case text-zinc-400">(optional)</span></span>
                    <input value={shipping.addressLine2} onChange={(e) => setField("addressLine2", e.target.value)} placeholder="Flat 4" className={inputClass()} />
                  </label>
                  <label className="block">
                    <span className={labelClass()}>City</span>
                    <input value={shipping.city} onChange={(e) => setField("city", e.target.value)} placeholder="London" className={inputClass()} />
                  </label>
                  <label className="block">
                    <span className={labelClass()}>Postcode</span>
                    <input value={shipping.postcode} onChange={(e) => setField("postcode", e.target.value)} placeholder="SW1A 1AA" className={inputClass()} />
                  </label>
                </div>

                {/* Shipping options — shown automatically based on weight */}
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">Shipping Options</p>
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${selectedRateId === option.id ? "border-[rgba(200,155,60,0.5)] bg-[rgba(200,155,60,0.08)]" : "border-[rgba(0,0,0,0.08)] bg-white hover:border-[rgba(200,155,60,0.3)]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shippingRate" value={option.id} checked={selectedRateId === option.id} onChange={() => setSelectedRateId(option.id)} className="accent-amber-500" />
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-800">{option.label}</p>
                          <p className="text-[11px] text-zinc-400">{option.description}</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-black text-[#c89b3c]">{formatGBP(option.price)}</p>
                    </label>
                  ))}
                </div>
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
                    <dt>Shipping</dt>
                    <dd className="font-bold text-zinc-900">
                      {selectedRate ? formatGBP(selectedRate.price) : <span className="text-[12px] text-zinc-400">Select option</span>}
                    </dd>
                  </div>
                  <div className="border-t" style={{ borderColor: "rgba(200,155,60,0.15)" }} />
                  <div className="flex items-center justify-between text-base">
                    <dt className="font-black text-zinc-900">Total</dt>
                    <dd className="font-black text-zinc-900">{formatGBP(orderTotal)}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => void handleStartSumUpCheckout()}
                  disabled={isStartingCheckout || !selectedRateId}
                  className="btn-gold mt-5 w-full rounded-full py-3 text-[13px] font-bold disabled:opacity-50"
                >
                  {isStartingCheckout ? "Opening SumUp..." : "Checkout"}
                </button>

                {checkoutError && (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700 border border-rose-200">{checkoutError}</p>
                )}

                <p className="mt-3 text-center text-[11px] text-zinc-400">
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
