"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import getBrowserSupabase from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";
import { buildPublicCardPath, buildPublicCardSlugs } from "@/lib/cards/slug";
import type { CatalogueCard } from "@/lib/demo-data/catalogue";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";
import { triggerFlyToCart } from "@/components/FlyToCart";

type SortOption = "cardNumber" | "playerName" | "priceLow" | "priceHigh";

export function CatalogueGrid() {
  const cart = useCart();
  const [recentlyAddedCardId, setRecentlyAddedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<CatalogueCard[]>([]);
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [parallelFilter, setParallelFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("cardNumber");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const options = useMemo(() => ({
    sets: Array.from(new Set(cards.map((c) => c.setName))).sort(),
    teams: Array.from(new Set(cards.map((c) => c.team))).filter(Boolean).sort(),
    parallels: Array.from(new Set(cards.map((c) => c.parallel).filter(Boolean))).sort(),
  }), [cards]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let mounted = true;
    setIsLoading(true);
    (async () => {
      const { data, error } = await supabase.from("cards").select("*").eq("status", "published").order("card_number", { ascending: true });
      if (!mounted) return;
      if (error) { setLoadError(error.message); setIsLoading(false); return; }

      // Deduplicate: one card per card_number+set_name, prefer no parallel (base)
      const seen = new Map<string, any>();
      for (const d of (data ?? [])) {
        const key = `${d.set_name ?? ""}__${d.card_number ?? ""}`;
        const existing = seen.get(key);
        if (!existing || (!d.parallel && existing.parallel)) {
          seen.set(key, d);
        }
      }
      const deduped = Array.from(seen.values());

      const mapped = (deduped).map((d: any) => {
        const setName = d.set_name ?? d.setName ?? "";
        const title = d.title ?? d.player ?? "";
        const cardNumber = d.card_number ?? d.cardNumber ?? "";
        const rawStock = Number(d.stock ?? d.quantity);
        const availableQuantity = Number.isFinite(rawStock) ? Math.max(0, rawStock) : undefined;
        const { setSlug, cardSlug } = buildPublicCardSlugs({ setName, title, player: d.player, cardNumber });
        return {
          id: d.id, playerName: d.player ?? "Unknown", cardNumber: cardNumber || "?",
          availableQuantity, team: d.team ?? "", setName, brand: d.brand ?? "",
          price: Number(d.price ?? 0),
          stockStatus: d.stock_status ?? (availableQuantity === undefined ? "In stock" : availableQuantity > 0 ? "In stock" : "Out of stock"),
          imageUrl: d.image_url ?? d.imageUrl, backImageUrl: d.back_image_url ?? d.backImageUrl,
          description: d.description ?? "", season: d.season ?? "", condition: d.condition ?? "",
          estimatedValue: Number(d.estimated_value ?? 0), marketplacePrice: Number(d.marketplace_price ?? 0),
          population: Number(d.population ?? 0),
          isOneOfOne: Boolean(d.is_one_of_one ?? false),
          parallel: d.parallel ?? "",
          slug: d.slug ?? "", setSlug, cardSlug,
        };
      });
      setCards(mapped as unknown as CatalogueCard[]);
      setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const visibleCards = useMemo(() => {
    const q = query.toLowerCase();
    return cards
      .filter((c) => {
        if (q && !c.playerName.toLowerCase().includes(q) && !c.team.toLowerCase().includes(q) && !c.setName.toLowerCase().includes(q) && !c.cardNumber.toLowerCase().includes(q)) return false;
        if (setFilter !== "all" && c.setName !== setFilter) return false;
        if (teamFilter !== "all" && c.team !== teamFilter) return false;
        if (parallelFilter !== "all" && (c.parallel ?? "") !== parallelFilter) return false;
        if (inStockOnly && c.stockStatus !== "In stock") return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "playerName") return a.playerName.localeCompare(b.playerName);
        if (sortBy === "priceHigh") return b.price - a.price;
        if (sortBy === "priceLow") return a.price - b.price;
        return (parseInt(a.cardNumber) || 0) - (parseInt(b.cardNumber) || 0);
      });
  }, [cards, query, setFilter, teamFilter, inStockOnly, sortBy]);

  return (
    <div className="space-y-10">

      {/* ══ DISCOVERY HERO ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl animate-fade-up border border-[rgba(200,155,60,0.15)]" style={{ minHeight: 340 }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #fef9ec 0%, #fdf6e3 40%, #f8f6f2 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(200,155,60,0.15), transparent)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative p-8 sm:p-12">
          <div className="max-w-2xl space-y-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#92400e]">Browse the Vault</span>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl font-display">
              Find your next<br />
              <span className="text-gold">chase card.</span>
            </h1>
            <p className="text-[14px] leading-relaxed text-zinc-500">
              {isLoading ? "Loading the vault..." : `${visibleCards.length} card${visibleCards.length !== 1 ? "s" : ""} available.`}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: "⚽ Football", filter: () => { setSetFilter("all"); setTeamFilter("all"); }, active: !query && setFilter === "all" },
              { label: "✨ Disney", filter: () => { setSetFilter("all"); }, active: false },
              { label: "📦 In Stock", filter: () => setInStockOnly((v) => !v), active: inStockOnly },
            ].map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={cat.filter}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  cat.active
                    ? "border-[rgba(200,155,60,0.4)] bg-[rgba(200,155,60,0.12)] text-[#92400e]"
                    : "border-[rgba(0,0,0,0.1)] bg-white text-zinc-600 hover:border-[rgba(0,0,0,0.15)] hover:text-zinc-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SEARCH + FILTERS ════════════════════════════════════════════ */}
      <div className="animate-fade-up space-y-3" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player, team, set..."
              className="w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white py-3.5 pl-10 pr-4 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 transition focus:border-[rgba(200,155,60,0.4)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex-1 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition sm:flex-none sm:px-5 ${showFilters ? "border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.08)] text-[#92400e]" : "border-[rgba(0,0,0,0.1)] bg-white text-zinc-600 hover:text-zinc-900"}`}
            >
              Filters {showFilters ? "↑" : "↓"}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white px-3 py-3.5 text-sm text-zinc-700 outline-none sm:flex-none sm:px-4"
            >
              <option value="cardNumber">Card #</option>
              <option value="playerName">Player</option>
              <option value="priceLow">Price ↑</option>
              <option value="priceHigh">Price ↓</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="animate-fade-up grid gap-3 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4 sm:grid-cols-2">
            <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)} className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-3 py-2.5 text-sm text-zinc-700 outline-none">
              <option value="all">All sets</option>
              {options.sets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-3 py-2.5 text-sm text-zinc-700 outline-none">
              <option value="all">All teams</option>
              {options.teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {options.parallels.length > 0 && (
              <select value={parallelFilter} onChange={(e) => setParallelFilter(e.target.value)} className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-3 py-2.5 text-sm text-zinc-700 outline-none">
                <option value="all">All parallels</option>
                {options.parallels.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {/* ══ LOADING ═════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      )}

      {/* ══ ERROR ═══════════════════════════════════════════════════════ */}
      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{loadError}</div>
      )}

      {/* ══ EMPTY ═══════════════════════════════════════════════════════ */}
      {!isLoading && !loadError && visibleCards.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No cards match your search"
          description="Try different keywords or clear your filters to see everything in the vault."
          actions={[{ label: "Browse all cards", href: "/catalogue", primary: true }]}
        />
      )}

      {/* ══ CARD GRID ═══════════════════════════════════════════════════ */}
      {!isLoading && !loadError && visibleCards.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 stagger-grid">
          {visibleCards.map((card) => {
            const inCartQty = cart.getItemQuantity(card.id);
            const hasStockCap = typeof card.availableQuantity === "number";
            const avail = hasStockCap ? Math.max(0, Number(card.availableQuantity)) : Infinity;
            const isOOS = hasStockCap ? avail <= 0 || card.stockStatus === "Out of stock" : card.stockStatus === "Out of stock";
            const maxed = hasStockCap && !isOOS && inCartQty >= avail;
            const justAdded = recentlyAddedCardId === card.id;
            const isDisney = card.setName.toLowerCase().includes("disney");

            return (
              <article
                key={card.id}
                className={`card-foil card-holo card-tilt group relative overflow-hidden rounded-2xl bg-white`}
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty("--foil-x", `${x}%`);
                  e.currentTarget.style.setProperty("--foil-y", `${y}%`);
                  // 3D tilt
                  const tiltX = ((y - 50) / 50) * -4;
                  const tiltY = ((x - 50) / 50) * 4;
                  const inner = e.currentTarget.querySelector('.card-tilt-inner') as HTMLElement;
                  if (inner) inner.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
                }}
                onMouseLeave={(e) => {
                  const inner = e.currentTarget.querySelector('.card-tilt-inner') as HTMLElement;
                  if (inner) inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
                }}
              >
                <Link
                  href={
                    (card as any).setSlug && (card as any).cardSlug
                      ? `/catalogue/${(card as any).setSlug}/${(card as any).cardSlug}`
                      : buildPublicCardPath({ setName: card.setName, title: card.playerName, player: card.playerName, cardNumber: card.cardNumber })
                  }
                  className="block card-tilt-inner"
                >
                  <div className="relative aspect-[2/3] overflow-hidden p-10">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={`${card.playerName} card`} className="h-full w-full rounded-xl object-contain bg-slate-50 transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3" style={{ background: isDisney ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                        <span className="text-4xl opacity-30">{isDisney ? "✨" : "⚽"}</span>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-400">Card artwork</p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0" />

                    <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${isDisney ? "badge-disney" : "badge-football"}`}>
                      {isDisney ? "✨ Disney" : "⚽ Football"}
                    </span>

                    <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${card.stockStatus === "In stock" ? "badge-owned" : card.stockStatus === "Low stock" ? "badge-gold" : "badge-limited"}`}>
                      {card.stockStatus}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-zinc-800">{card.playerName}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-400">#{card.cardNumber} · {card.team}</p>
                      </div>
                      <p className="flex-shrink-0 text-sm font-black text-[#c89b3c]">{formatGBP(card.price)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {card.parallel && <span className="rounded-full bg-[#fafaf9] px-2 py-0.5 text-[10px] text-zinc-500" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>{card.parallel}</span>}
                    </div>
                  </div>
                </Link>

                <div className="px-4 pb-4">
                  <button
                    type="button"
                    disabled={isOOS || maxed}
                    onClick={(e) => {
                      if (isOOS || maxed) return;
                      // Trigger fly animation
                      const article = e.currentTarget.closest("article");
                      const img = article?.querySelector("img");
                      if (img) {
                        triggerFlyToCart(card.imageUrl || "", img.getBoundingClientRect());
                      } else if (article) {
                        triggerFlyToCart(card.imageUrl || "", article.getBoundingClientRect());
                      }
                      setRecentlyAddedCardId(card.id);
                      window.setTimeout(() => setRecentlyAddedCardId((c) => c === card.id ? null : c), 1000);
                      cart.addToCart({ id: card.id, playerName: card.playerName, cardNumber: card.cardNumber, price: card.price, imageUrl: card.imageUrl, availableQuantity: hasStockCap ? avail : undefined });
                    }}
                    className={`w-full rounded-full py-2.5 text-sm font-bold transition-all ${
                      isOOS || maxed
                        ? "cursor-not-allowed bg-[#fafaf9] text-zinc-300"
                        : justAdded
                        ? "animate-added-chip bg-[#dcfce7] text-[#15803d] border border-[rgba(22,163,74,0.3)]"
                        : "btn-gold"
                    }`}
                  >
                    {isOOS ? "Out of stock" : maxed ? "Max qty" : justAdded ? "✓ Added to vault" : "Add to Cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
