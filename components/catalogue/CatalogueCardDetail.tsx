"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogueCard } from "@/lib/demo-data/catalogue";
import { ArrowUpIcon, SearchIcon, SparkleIcon } from "@/components/ui/icons";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";

type Variant = {
  id: string;
  parallel: string;
  price: number;
  imageUrl: string | null;
  printRun: string | null;
  stockStatus: string;
  availableQuantity: number | undefined;
  isBase: boolean;
};

type CatalogueCardDetailProps = {
  card: CatalogueCard;
  relatedCards?: Array<{
    id: string;
    playerName: string;
    cardNumber: string;
    price: number;
    availableQuantity?: number;
    imageUrl?: string;
    setSlug: string;
    cardSlug: string;
  }>;
  variants?: Variant[];
};

function getBadgeClass(status: string) {
  if (status === "In stock") {
    return "border-emerald-400/30 bg-emerald-100/90 text-emerald-800";
  }

  if (status === "Low stock") {
    return "border-amber-400/35 bg-amber-100/90 text-amber-800";
  }

  return "border-rose-400/30 bg-rose-100/90 text-rose-700";
}

function displayValue(value: string | number | undefined | null, fallback = "Not available") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

export function CatalogueCardDetail({ card, relatedCards = [], variants = [] }: CatalogueCardDetailProps) {
  const cart = useCart();
  const [showBack, setShowBack] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  const activeVariant = variants.find((v) => v.id === activeVariantId) ?? null;

  // Use active variant values if one is selected, otherwise fall back to base card
  const displayPrice = activeVariant ? activeVariant.price : Number(card.price ?? 0);
  const displayImage = activeVariant?.imageUrl ?? card.imageUrl;
  const displayPrintRun = activeVariant?.printRun
    ? String(activeVariant.printRun).startsWith("/") ? activeVariant.printRun : `/${activeVariant.printRun}`
    : card.printRun ? String(card.printRun).startsWith("/") ? String(card.printRun) : `/${card.printRun}` : null;
  const displayStockStatus = activeVariant?.stockStatus ?? card.stockStatus;
  const displayAvailableQty = activeVariant ? activeVariant.availableQuantity : card.availableQuantity;
  const activeId = activeVariant?.id ?? card.id;
  const hasBackImage = Boolean(card.backImageUrl);
  const cardLabel = `${displayValue(card.playerName, "Card")} #${displayValue(card.cardNumber, "?")}`;
  const setLabel = displayValue(card.setName, "Unknown set");
  const hasStockCap = typeof displayAvailableQty === "number";
  const availableQuantity = hasStockCap ? Math.max(0, Number(displayAvailableQty)) : Number.POSITIVE_INFINITY;
  const inCartQuantity = cart.getItemQuantity(activeId);
  const isOutOfStock = hasStockCap ? availableQuantity <= 0 || displayStockStatus === "Out of stock" : displayStockStatus === "Out of stock";
  const reachedStockLimit = hasStockCap && !isOutOfStock && inCartQuantity >= availableQuantity;

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-300/50 bg-white/92 p-7 shadow-[0_24px_52px_rgba(15,23,42,0.1)] sm:p-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
          <Link href="/catalogue" className="rounded-full border border-slate-300/70 bg-white px-3 py-1.5 text-zinc-700 transition hover:bg-slate-50">
            <span className="inline-flex items-center gap-2"><SearchIcon className="h-3.5 w-3.5" />Catalogue</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="rounded-full border border-slate-300/70 bg-white/70 px-3 py-1.5">{setLabel}</span>
          <span className="text-zinc-600">/</span>
          <span className="rounded-full border border-amber-300/45 bg-amber-100/90 px-3 py-1.5 text-amber-900">{cardLabel}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-amber-700">Card detail</p>
            <h1 className="mt-2 text-4xl font-semibold text-zinc-900">{displayValue(card.playerName, "Unknown player")}</h1>
            <p className="mt-2 text-sm text-zinc-600">{displayValue(card.brand, "Unknown brand")} · {setLabel}</p>
          </div>
          <Link href="/catalogue" className="rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-slate-50">
            <span className="inline-flex items-center gap-2"><ArrowUpIcon className="h-3.5 w-3.5 rotate-[-90deg]" />Back to catalogue</span>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${getBadgeClass(displayStockStatus)}`}>
            {displayStockStatus}
          </span>
          {card.isOneOfOne ? <span className="rounded-full border border-sky-400/35 bg-sky-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">1/1</span> : null}
        </div>

        {/* Variant selector */}
        {variants.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">Variants</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveVariantId(null)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeVariantId === null
                    ? "border-amber-400/50 bg-amber-100/90 text-amber-900"
                    : "border-slate-300/70 bg-white text-zinc-600 hover:border-amber-300/50"
                }`}
              >
                Base
              </button>
              {variants.filter((v) => !v.isBase).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVariantId(v.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeVariantId === v.id
                      ? "border-amber-400/50 bg-amber-100/90 text-amber-900"
                      : "border-slate-300/70 bg-white text-zinc-600 hover:border-amber-300/50"
                  }`}
                >
                  {v.parallel}
                  {v.printRun ? ` ${v.printRun.startsWith("/") ? v.printRun : "/" + v.printRun}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Image */}
          <div className="rounded-2xl border border-slate-300/50 bg-[#faf8f2]/95 p-3 mx-auto w-full max-w-[220px] lg:max-w-[260px]">
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-100 via-white to-zinc-100">
              {displayImage || card.backImageUrl ? (
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl p-3">
                  <img src={showBack ? card.backImageUrl ?? displayImage : displayImage ?? card.backImageUrl} alt={`${displayValue(card.playerName, "Card")} ${showBack ? "back" : "front"} card`} className={`h-full w-full rounded-lg object-contain ${showBack ? "rotate-180" : ""}`} />
                </div>
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-zinc-500">
                  <p className="text-sm uppercase tracking-[0.25em]">No image</p>
                </div>
              )}
            </div>
            {hasBackImage && (
              <button type="button" onClick={() => setShowBack((v) => !v)} className="mt-2 w-full rounded-full border border-amber-400/40 bg-amber-100/90 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-200/80">
                {showBack ? "Show front" : "Show back"}
              </button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Price</p>
                <p className="mt-1 text-3xl font-semibold text-amber-700">{formatGBP(displayPrice)}</p>
              </div>
              <button
                type="button"
                disabled={isOutOfStock || reachedStockLimit}
                onClick={() => {
                  if (isOutOfStock || reachedStockLimit) return;
                  setJustAddedToCart(true);
                  window.setTimeout(() => setJustAddedToCart(false), 900);
                  cart.addToCart({
                    id: activeId,
                    playerName: card.playerName,
                    cardNumber: card.cardNumber,
                    price: displayPrice,
                    imageUrl: displayImage,
                    availableQuantity: hasStockCap ? availableQuantity : undefined,
                  });
                }}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  isOutOfStock || reachedStockLimit
                    ? "cursor-not-allowed border-slate-300/70 bg-slate-100/85 text-zinc-500"
                    : justAddedToCart
                    ? "animate-added-chip border-emerald-400/45 bg-emerald-100/95 text-emerald-900"
                    : "border-amber-400/40 bg-amber-100/90 text-amber-900 hover:bg-amber-200/80"
                }`}
              >
                {isOutOfStock ? "Out of stock" : reachedStockLimit ? "Max qty" : justAddedToCart ? "Added ✓" : "Add to Cart"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-300/60 bg-[#f8f5ee]/90 p-4">
              <dl className="grid grid-cols-2 gap-2 text-sm text-zinc-700">
                <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                  <dt className="text-[11px] text-zinc-500">Player</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900 truncate">{displayValue(card.playerName)}</dd>
                </div>
                <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                  <dt className="text-[11px] text-zinc-500">Card #</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900">#{displayValue(card.cardNumber, "?")}</dd>
                </div>
                {card.team && String(card.team).trim() && (
                  <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                    <dt className="text-[11px] text-zinc-500">Team</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900 truncate">{card.team}</dd>
                  </div>
                )}
                {card.brand && String(card.brand).trim() && (
                  <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                    <dt className="text-[11px] text-zinc-500">Brand</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900 truncate">{card.brand}</dd>
                  </div>
                )}
                <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                  <dt className="text-[11px] text-zinc-500">Set</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900 truncate">{setLabel}</dd>
                </div>
                {card.season && String(card.season).trim() && (
                  <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                    <dt className="text-[11px] text-zinc-500">Season</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900">{card.season}</dd>
                  </div>
                )}
                {card.parallel && String(card.parallel).trim() && (
                  <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                    <dt className="text-[11px] text-zinc-500">Parallel</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900">{card.parallel}</dd>
                  </div>
                )}
                {displayPrintRun && (
                  <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                    <dt className="text-[11px] text-zinc-500">Print run</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900">{displayPrintRun}</dd>
                  </div>
                )}
                <div className="rounded-xl border border-slate-300/60 bg-white/90 p-2.5">
                  <dt className="text-[11px] text-zinc-500">Stock</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900">{card.stockStatus}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-300/50 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.09)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-zinc-900"><SparkleIcon className="h-4 w-4" />More from this set</h2>
          <span className="rounded-full border border-slate-300/70 px-3 py-1 text-xs uppercase tracking-[0.25em] text-zinc-600">{relatedCards.length} cards</span>
        </div>

        {relatedCards.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-300/60 bg-white/80 p-5 text-sm text-zinc-600">No other published cards from this set yet.</div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedCards.map((item) => (
              <Link key={item.id} href={`/catalogue/${item.setSlug}/${item.cardSlug}`} className="group rounded-2xl border border-slate-300/60 bg-white/88 p-3 transition hover:border-amber-300/50 hover:bg-white card-lift">
                <div className="h-56 overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-100 to-zinc-100">
                  {item.imageUrl ? <img src={item.imageUrl} alt={`${item.playerName} card`} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-zinc-500">Placeholder</div>}
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900">{item.playerName}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
                  <span>#{item.cardNumber}</span>
                  <span className="font-semibold text-amber-700">{formatGBP(Number(item.price ?? 0))}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
