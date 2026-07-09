"use client";

import { useEffect, useState } from "react";
import type { SetCard } from "@/lib/demo-data/sets";

type SetCardDetailsPanelProps = {
  card: SetCard | null;
  onToggleOwned: () => void;
  onToggleWishlist: () => void;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
};

export function SetCardDetailsPanel({ card, onToggleOwned, onToggleWishlist, onIncreaseQuantity, onDecreaseQuantity }: SetCardDetailsPanelProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [card?.id]);

  if (!card) {
    return null;
  }

  const isOwned = card.status === "owned" || card.status === "duplicate";
  const isWishlist = card.status === "wishlist";

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Card details</p>
      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-zinc-900/80 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">#{card.number}</p>
            <p className="mt-1 text-sm text-zinc-400">{card.player}</p>
            <p className="mt-1 text-sm text-zinc-500">{card.team}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
            card.status === "owned" || card.status === "duplicate"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : card.status === "wishlist"
                ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                : "border-rose-400/20 bg-rose-400/10 text-rose-200"
          }`}>
            {card.status === "duplicate" ? "Duplicate" : card.status}
          </span>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800/80 p-4">
          <div className="rounded-[1.2rem] border border-white/10 bg-zinc-900/80 p-3 text-center">
            <div className="rounded-[1rem] border border-white/10 bg-black/30 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Set card</p>
              <p className="mt-3 text-2xl font-semibold text-white">{card.player}</p>
              <p className="mt-2 text-sm text-zinc-400">{card.title}</p>
              <p className="mt-8 text-4xl font-semibold text-amber-300">#{card.number}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => setIsFlipped((value) => !value)} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20">
            {isFlipped ? "Show Front" : "Flip Card"}
          </button>
          <button type="button" onClick={onToggleOwned} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20">
            {isOwned ? "Mark Missing" : "Mark Owned"}
          </button>
          <button type="button" onClick={onToggleWishlist} className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20">
            {isWishlist ? "Remove Wishlist" : "Add Wishlist"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onDecreaseQuantity} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/10">
              Decrease
            </button>
            <button type="button" onClick={onIncreaseQuantity} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20">
              Increase
            </button>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm text-zinc-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <dt className="text-zinc-500">Status</dt>
            <dd className="font-medium text-white">{card.status === "duplicate" ? "Duplicate owned" : card.status}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <dt className="text-zinc-500">Quantity</dt>
            <dd className="font-medium text-white">{card.quantity}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Team</dt>
            <dd className="font-medium text-white">{card.team}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
