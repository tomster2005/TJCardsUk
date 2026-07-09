"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import getBrowserSupabase from "@/lib/supabase/client";
import { buildPublicCardPath, buildPublicCardSlugs } from "@/lib/cards/slug";
import type { CatalogueCard } from "@/lib/demo-data/catalogue";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";

type SortOption = "cardNumber" | "playerName" | "priceLow" | "priceHigh";

export function CatalogueGrid() {
  const cart = useCart();
  const [recentlyAddedCardId, setRecentlyAddedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<CatalogueCard[]>([]);
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("cardNumber");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const options = useMemo(() => ({
    sets: Array.from(new Set(cards.map((c) => c.setName))).sort(),
    teams: Array.from(new Set(cards.map((c) => c.team))).sort(),
    rarities: Array.from(new Set(cards.map((c) => c.rarity))).sort(),
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
      const mapped = (data ?? []).map((d: any) => {
        const setName = d.set_name ?? d.setName ?? "";
        const title = d.title ?? d.player ?? "";
        const cardNumber = d.card_number ?? d.cardNumber ?? "";
        const rawStock = Number(d.stock ?? d.quantity);
        const availableQuantity = Number.isFinite(rawStock) ? Math.max(0, rawStock) : undefined;
        const { setSlug, cardSlug } = buildPublicCardSlugs({ setName, title, player: d.player, cardNumber });
        return {
          id: d.id, playerName: d.player ?? "Unknown", cardNumber: cardNumber || "?",
          availableQuantity, team: d.team ?? "", setName, brand: d.brand ?? "",
          parallel: d.parallel ?? "", rarity: d.rarity ?? "", price: Number(d.price ?? 0),
          stockStatus: d.stock_status ?? (availableQuantity === undefined ? "In stock" : availableQuantity > 0 ? "In stock" : "Out of stock"),
          imageUrl: d.image_url ?? d.imageUrl, backImageUrl: d.back_image_url ?? d.backImageUrl,
          description: d.description ?? "", season: d.season ?? "", condition: d.condition ?? "",
          estimatedValue: Number(d.estimated_value ?? 0), marketplacePrice: Number(d.marketplace_price ?? 0),
          population: Number(d.population ?? 0), isRare: Boolean(d.is_rare ?? false),
          isOneOfOne: Boolean(d.is_one_of_one ?? false),
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
        if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
        if (inStockOnly && c.stockStatus !== "In stock") return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "playerName") return a.playerName.localeCompare(b.playerName);
        if (sortBy === "priceHigh") return b.price - a.price;
        if (sortBy === "priceLow") return a.price - b.price;
        return (parseInt(a.cardNumber) || 0) - (parseInt(b.cardNumber) || 0);
      });
  }, [cards, query, setFilter, teamFilter, rarityFilter, inStockOnly, sortBy]);

  const footballCards = visibleCards.filter((c) => !c.setName.toLowerCase().includes("disney"));
  const disneyCards = visibleCards.filter((c) => c.setName.toLowerCase().includes("disney"));

  return (
    <div className="space-y-10">

      {/* ══ DISCOVERY HERO ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl animate-fade-up" style={{ minHeight: 340 }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #080c10 0%, #0d1a0f 40%, #06091a 70%, #0d0d0f 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(200,155,60,0.1), transparent)" }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative p-8 sm:p-12">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[rgba(200,155,60,0.8)]">Browse the Vault</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Find your next<br />
              <span className="text-gold">chase card.</span>
            </h1>
            <p className="text-[14px] leading-relaxed text-[rgba(232,230,225,0.4)]">
              {isLoading ? "Loading the vault..." : `${visibleCards.length} cards available across Football and Disney collections.`}
            </p>
          </div>

          {/* Category quick-select */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: "⚽ Football", filter: () => { setSetFilter("all"); setTeamFilter("all"); }, active: !query && setFilter === "all" },
              { label: "✨ Disney", filter: () => { setSetFilter("all"); }, active: false },
              { label: "🔥 Rare Pulls", filter: () => setRarityFilter("Rare"), active: rarityFilter === "Rare" },
              { label: "📦 In Stock", filter: () => setInStockOnly((v) => !v), active: inStockOnly },
            ].map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={cat.filter}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  cat.active
                    ? "border-[rgba(200,155,60,0.4)] bg-[rgba(200,155,60,0.12)] text-[#f5d97a]"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(232,230,225,0.6)] hover:border-[rgba(255,255,255,0.15)] hover:text-[rgba(232,230,225,0.9)]"
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
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(232,230,225,0.3)]">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player, team, set, card number..."
              className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] py-3.5 pl-10 pr-4 text-sm text-[rgba(232,230,225,0.9)] outline-none placeholder:text-[rgba(232,230,225,0.25)] transition focus:border-[rgba(200,155,60,0.3)] focus:bg-[rgba(255,255,255,0.06)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-2xl border px-5 py-3.5 text-sm font-semibold transition ${showFilters ? "border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.08)] text-[#f5d97a]" : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(232,230,225,0.6)] hover:text-[rgba(232,230,225,0.9)]"}`}
          >
            Filters {showFilters ? "↑" : "↓"}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-sm text-[rgba(232,230,225,0.7)] outline-none"
          >
            <option value="cardNumber">Card #</option>
            <option value="playerName">Player</option>
            <option value="priceLow">Price ↑</option>
            <option value="priceHigh">Price ↓</option>
          </select>
        </div>

        {showFilters && (
          <div className="animate-fade-up grid gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 sm:grid-cols-3">
            <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[rgba(232,230,225,0.7)] outline-none">
              <option value="all">All sets</option>
              {options.sets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[rgba(232,230,225,0.7)] outline-none">
              <option value="all">All teams</option>
              {options.teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[rgba(232,230,225,0.7)] outline-none">
              <option value="all">All rarities</option>
              {options.rarities.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
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
        <div className="rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)] p-6 text-sm text-[#f87171]">{loadError}</div>
      )}

      {/* ══ EMPTY ═══════════════════════════════════════════════════════ */}
      {!isLoading && !loadError && visibleCards.length === 0 && (
        <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: "rgba(255,255,255,0.04)" }}>🔍</div>
          <p className="text-lg font-bold text-[rgba(232,230,225,0.8)]">No cards found</p>
          <p className="mt-2 text-sm text-[rgba(232,230,225,0.35)]">Try adjusting your search or filters</p>
          <button type="button" onClick={() => { setQuery(""); setSetFilter("all"); setTeamFilter("all"); setRarityFilter("all"); setInStockOnly(false); }} className="mt-5 rounded-full border border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.08)] px-5 py-2.5 text-sm font-semibold text-[#f5d97a] transition hover:bg-[rgba(200,155,60,0.14)]">
            Clear filters
          </button>
        </div>
      )}

      {/* ══ CARD GRID ═══════════════════════════════════════════════════ */}
      {!isLoading && !loadError && visibleCards.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-grid">
          {visibleCards.map((card) => {
            const inCartQty = cart.getItemQuantity(card.id);
            const hasStockCap = typeof card.availableQuantity === "number";
            const avail = hasStockCap ? Math.max(0, Number(card.availableQuantity)) : Infinity;
            const isOOS = hasStockCap ? avail <= 0 || card.stockStatus === "Out of stock" : card.stockStatus === "Out of stock";
            const maxed = hasStockCap && !isOOS && inCartQty >= avail;
            const justAdded = recentlyAddedCardId === card.id;
            const isDisney = card.setName.toLowerCase().includes("disney");

            return (
              <article key={card.id} className={`card-foil card-lift group relative overflow-hidden rounded-2xl ${card.isRare ? "card-rare" : ""}`} style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
                <Link
                  href={
                    (card as any).setSlug && (card as any).cardSlug
                      ? `/catalogue/${(card as any).setSlug}/${(card as any).cardSlug}`
                      : buildPublicCardPath({ setName: card.setName, title: card.playerName, player: card.playerName, cardNumber: card.cardNumber })
                  }
                  className="block"
                >
                  <div className="relative h-72 overflow-hidden">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={`${card.playerName} card`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3" style={{ background: isDisney ? "linear-gradient(135deg, #06091a, #0d1535)" : "linear-gradient(135deg, #0a1a0f, #0f2d1a)" }}>
                        <span className="text-4xl opacity-20">{isDisney ? "✨" : "⚽"}</span>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-[rgba(232,230,225,0.3)]">Card artwork</p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />

                    {/* Category badge */}
                    <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${isDisney ? "badge-disney" : "badge-football"}`}>
                      {isDisney ? "✨ Disney" : "⚽ Football"}
                    </span>

                    {/* Stock badge */}
                    <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${card.stockStatus === "In stock" ? "badge-owned" : card.stockStatus === "Low stock" ? "badge-gold" : "badge-limited"}`}>
                      {card.stockStatus}
                    </span>

                    {card.isRare && (
                      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), transparent 50%, rgba(59,130,246,0.06))" }} />
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[rgba(232,230,225,0.9)]">{card.playerName}</p>
                        <p className="mt-0.5 text-[11px] text-[rgba(232,230,225,0.4)]">#{card.cardNumber} · {card.team}</p>
                      </div>
                      <p className="flex-shrink-0 text-sm font-black text-[#f5d97a]">{formatGBP(card.price)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {card.parallel && <span className="rounded-full bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[10px] text-[rgba(232,230,225,0.4)]">{card.parallel}</span>}
                      {card.rarity && <span className={`rounded-full px-2 py-0.5 text-[10px] ${card.isRare ? "badge-rare" : "bg-[rgba(255,255,255,0.05)] text-[rgba(232,230,225,0.4)]"}`}>{card.rarity}</span>}
                    </div>
                  </div>
                </Link>

                <div className="px-4 pb-4">
                  <button
                    type="button"
                    disabled={isOOS || maxed}
                    onClick={() => {
                      if (isOOS || maxed) return;
                      setRecentlyAddedCardId(card.id);
                      window.setTimeout(() => setRecentlyAddedCardId((c) => c === card.id ? null : c), 1000);
                      cart.addToCart({ id: card.id, playerName: card.playerName, cardNumber: card.cardNumber, price: card.price, imageUrl: card.imageUrl, availableQuantity: hasStockCap ? avail : undefined });
                    }}
                    className={`w-full rounded-full py-2.5 text-sm font-bold transition-all ${
                      isOOS || maxed
                        ? "cursor-not-allowed bg-[rgba(255,255,255,0.04)] text-[rgba(232,230,225,0.25)]"
                        : justAdded
                        ? "animate-added-chip bg-[rgba(34,197,94,0.12)] text-[#4ade80] border border-[rgba(34,197,94,0.25)]"
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
