"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";

export function CartDrawer() {
  const { isCartOpen, closeCart, items, itemCount, subtotal, grandTotal, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isCartOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-50 transition-all duration-300 ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />

      {/* Drawer */}
      <aside
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#141418", borderLeft: "1px solid rgba(255,255,255,0.06)", boxShadow: "-20px 0 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl text-sm" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", color: "#0d0d0f" }}>
              🛒
            </div>
            <h2 className="text-base font-bold text-[rgba(232,230,225,0.9)]">Your Cart</h2>
            {itemCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-[#0d0d0f]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-[rgba(232,230,225,0.4)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(232,230,225,0.8)]"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>🛒</div>
              <div>
                <p className="text-base font-bold text-[rgba(232,230,225,0.8)]">Your cart is empty</p>
                <p className="mt-1 text-[13px] text-[rgba(232,230,225,0.35)]">Browse the vault and add cards to get started.</p>
              </div>
              <button type="button" onClick={closeCart} className="rounded-full border border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.08)] px-6 py-2.5 text-sm font-semibold text-[#f5d97a] transition hover:bg-[rgba(200,155,60,0.14)]">
                Continue browsing
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {item.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.imageUrl} alt={item.playerName} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-xl opacity-20">🃏</div>
                    }
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[rgba(232,230,225,0.9)]">{item.playerName}</p>
                        <p className="text-[11px] text-[rgba(232,230,225,0.4)]">#{item.cardNumber}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.cardId)} className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[rgba(239,68,68,0.7)] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#f87171]" style={{ border: "1px solid rgba(239,68,68,0.15)" }}>
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => decreaseQuantity(item.cardId)} className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-[rgba(232,230,225,0.6)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(232,230,225,0.9)]" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>−</button>
                        <span className="min-w-6 text-center text-sm font-bold text-[rgba(232,230,225,0.9)]">{item.quantity}</span>
                        <button type="button" onClick={() => increaseQuantity(item.cardId)} disabled={typeof item.availableQuantity === "number" && item.quantity >= item.availableQuantity} className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-[rgba(232,230,225,0.6)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(232,230,225,0.9)] disabled:opacity-25" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>+</button>
                      </div>
                      <p className="text-sm font-black text-[#f5d97a]">{formatGBP(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-4 px-5 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
            <div className="flex items-center justify-between text-[13px] text-[rgba(232,230,225,0.5)]">
              <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
              <span className="font-semibold text-[rgba(232,230,225,0.8)]">{formatGBP(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black">
              <span className="text-[rgba(232,230,225,0.9)]">Total</span>
              <span className="text-[#f5d97a]">{formatGBP(grandTotal)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="block w-full rounded-full py-3.5 text-center text-sm font-black text-[#0d0d0f] transition hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 20px rgba(200,155,60,0.4)" }}>
              Checkout →
            </Link>
            <button type="button" onClick={closeCart} className="block w-full rounded-full border border-[rgba(255,255,255,0.08)] py-2.5 text-center text-sm font-semibold text-[rgba(232,230,225,0.5)] transition hover:border-[rgba(255,255,255,0.12)] hover:text-[rgba(232,230,225,0.8)]">
              Continue browsing
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
