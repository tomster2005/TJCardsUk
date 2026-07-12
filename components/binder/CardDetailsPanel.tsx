"use client";

import { useEffect, useState } from "react";
import { useCollection } from "@/contexts/CollectionContext";
import { binderDemoData } from "@/lib/demo-data/binder";
import type { BinderPocket } from "@/lib/demo-data/binder";

export function CardDetailsPanel({ pocket }: { pocket: BinderPocket | null }) {
  const { toggleOwned, toggleWishlist, increaseQuantity, decreaseQuantity } = useCollection();
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => { setIsFlipped(false); }, [pocket?.id]);

  if (!pocket) return null;

  const isRare = pocket.rarityName?.toLowerCase().includes("rare") || pocket.rarityName?.toLowerCase().includes("holo");

  return (
    <aside className="overflow-hidden rounded-2xl" style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border-hi)", boxShadow: "var(--shadow-sm)" }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--vault-border)", background: isRare ? "rgba(168,85,247,0.04)" : "transparent" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Card Details</p>
            <h3 className="mt-1 text-base font-black text-[#1c1917]">{pocket.playerName}</h3>
            <p className="text-[12px] text-[rgba(28,25,23,0.5)]">#{pocket.cardNumber} · {pocket.teamName}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${pocket.owned ? "badge-owned" : pocket.wishlist ? "badge-wishlist" : "bg-[rgba(0,0,0,0.04)] text-[rgba(28,25,23,0.5)] border border-[rgba(0,0,0,0.1)]"}`}>
            {pocket.owned ? "Owned" : pocket.wishlist ? "Wishlist" : "Missing"}
          </span>
        </div>
      </div>

      {/* Card image with 3D flip */}
      <div className="p-4">
        <div className="relative h-52 overflow-hidden rounded-xl" style={{ perspective: "1000px" }}>
          <div
            className="relative h-full w-full transition-all duration-600"
            style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            {/* Front */}
            <div className="absolute inset-0 overflow-hidden rounded-xl" style={{ backfaceVisibility: "hidden" }}>
              {pocket.status === "missing" ? (
                <div className="flex h-full flex-col items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #f0ede6, #e8e4dc)" }}>
                  <span className="text-4xl opacity-20">◎</span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.3)]">Not collected</p>
                </div>
              ) : pocket.imageUrl ? (
                <>
                  <img src={pocket.imageUrl} alt={pocket.playerName} className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                  {isRare && <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.12), transparent 50%, rgba(59,130,246,0.08))" }} />}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-bold text-white">{pocket.playerName}</p>
                    <p className="text-[10px] text-[rgba(255,255,255,0.5)]">#{pocket.cardNumber}</p>
                  </div>
                  {isRare && <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-2 py-0.5 text-[9px] font-black text-white">✦ Rare</span>}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg, #f0ede6, #e8e4dc)" }}>🃏</div>
              )}
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 overflow-hidden rounded-xl p-4"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #f9f5ed, #f0e8d8)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Collector Note</p>
              <p className="mt-2 text-[12px] leading-relaxed text-[rgba(28,25,23,0.6)]">{pocket.cardBackText || "No notes added."}</p>
              <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(200,155,60,0.08)", border: "1px solid rgba(200,155,60,0.2)" }}>
                <p className="text-[11px] font-bold text-[var(--gold-600)]">{pocket.parallelName}</p>
                <p className="mt-0.5 text-[10px] text-[rgba(28,25,23,0.5)]">{pocket.rarityName}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFlipped((v) => !v)}
          className="mt-3 w-full rounded-xl py-2 text-[12px] font-semibold text-[var(--gold-600)] transition hover:bg-[rgba(200,155,60,0.06)]"
          style={{ border: "1px solid rgba(200,155,60,0.25)" }}
        >
          {isFlipped ? "↩ Show front" : "↪ Flip card"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {[
          { label: "Rarity", value: pocket.rarityName },
          { label: "Parallel", value: pocket.parallelName },
          { label: "Quantity", value: String(pocket.quantity) },
          { label: "Set", value: binderDemoData.title },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--vault-border)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">{s.label}</p>
            <p className="mt-0.5 truncate text-[12px] font-bold text-[#1c1917]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-4" style={{ borderTop: "1px solid var(--vault-border)", paddingTop: 16 }}>
        <button type="button" onClick={() => toggleOwned(pocket.id)} className={`rounded-xl py-2.5 text-[12px] font-bold transition ${pocket.owned ? "badge-owned" : "bg-[rgba(0,0,0,0.03)] text-[rgba(28,25,23,0.6)] hover:bg-[rgba(0,0,0,0.06)]"}`} style={{ border: pocket.owned ? undefined : "1px solid var(--vault-border)" }}>
          {pocket.owned ? "✓ Owned" : "Mark owned"}
        </button>
        <button type="button" onClick={() => toggleWishlist(pocket.id)} className={`rounded-xl py-2.5 text-[12px] font-bold transition ${pocket.wishlist ? "badge-wishlist" : "bg-[rgba(0,0,0,0.03)] text-[rgba(28,25,23,0.6)] hover:bg-[rgba(0,0,0,0.06)]"}`} style={{ border: pocket.wishlist ? undefined : "1px solid var(--vault-border)" }}>
          {pocket.wishlist ? "♡ Wishlisted" : "♡ Wishlist"}
        </button>
        <button type="button" onClick={() => increaseQuantity(pocket.id)} className="rounded-xl py-2 text-[12px] font-semibold text-[rgba(28,25,23,0.5)] transition hover:bg-[rgba(0,0,0,0.05)] hover:text-[#1c1917]" style={{ border: "1px solid var(--vault-border)" }}>
          + Quantity
        </button>
        <button type="button" onClick={() => decreaseQuantity(pocket.id)} className="rounded-xl py-2 text-[12px] font-semibold text-[rgba(28,25,23,0.5)] transition hover:bg-[rgba(0,0,0,0.05)] hover:text-[#1c1917]" style={{ border: "1px solid var(--vault-border)" }}>
          − Quantity
        </button>
      </div>

      {pocket.quantity > 1 && (
        <div className="mx-4 mb-4 rounded-xl px-3 py-2 text-[11px] font-semibold text-[var(--gold-600)]" style={{ background: "rgba(200,155,60,0.08)", border: "1px solid rgba(200,155,60,0.2)" }}>
          ⚠ {pocket.quantity} copies — consider merging duplicates
        </div>
      )}
    </aside>
  );
}
