"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import getBrowserSupabase from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";
import { buildPublicCardPath } from "@/lib/cards/slug";
import type { CatalogueCard } from "@/lib/demo-data/catalogue";
import { useCart } from "@/contexts/CartContext";
import { formatGBP } from "@/lib/currency";
import { triggerFlyToCart } from "@/components/FlyToCart";
import { SearchIcon } from "@/components/ui/icons";
import { thumbUrl } from "@/lib/images";

const PAGE_SIZE = 48;
type SortOption = "cardNumber" | "playerName" | "priceLow" | "priceHigh";

// Shape returned by get_catalogue_page RPC
type RpcRow = {
  id: string;
  player: string;
  card_number: string;
  set_name: string;
  set_slug: string | null;
  card_slug: string | null;
  team: string | null;
  brand: string | null;
  parallel: string | null;
  category: string | null;
  price: number;
  stock: number;
  status: string;
  image_url: string | null;
  back_image_url: string | null;
  season: string | null;
  print_run: string | null;
  variant_group_id: string | null;
  is_base_variant: boolean | null;
  parallel_names: string[];
  total_count: number;
};

function rowToCard(d: RpcRow): CatalogueCard & {
  category: string; variantParallels: string[];
  parallelRowMap: Map<string, RpcRow>;
  setSlug: string; cardSlug: string; _raw: RpcRow;
} {
  const rawStock = Number(d.stock ?? 0);
  const availableQuantity = rawStock >= 0 ? rawStock : undefined;
  const setName = d.set_name ?? "";
  const cardNumber = d.card_number ?? "";
  const setSlug = d.set_slug ?? "";
  const cardSlug = d.card_slug ?? "";
  return {
    id: d.id,
    playerName: d.player ?? "Unknown",
    cardNumber: cardNumber || "?",
    availableQuantity,
    team: d.team ?? "",
    setName,
    brand: d.brand ?? "",
    price: Number(d.price ?? 0),
    stockStatus: availableQuantity === undefined ? "In stock" : availableQuantity > 0 ? "In stock" : "Out of stock",
    imageUrl: d.image_url ?? undefined,
    backImageUrl: d.back_image_url ?? undefined,
    description: "",
    season: d.season ?? "",
    condition: "",
    estimatedValue: 0,
    marketplacePrice: 0,
    population: 0,
    isOneOfOne: false,
    parallel: d.parallel ?? "",
    category: d.category ?? "",
    variantParallels: d.parallel_names ?? [],
    parallelRowMap: new Map(),
    setSlug,
    cardSlug,
    _raw: d,
  };
}

function readFilters() {
  try { return JSON.parse(sessionStorage.getItem("catalogue_filters") ?? "{}"); } catch { return {}; }
}

export function CatalogueGrid() {
  const cart = useCart();
  const [recentlyAddedCardId, setRecentlyAddedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<ReturnType<typeof rowToCard>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filter / sort state — restored from sessionStorage on mount
  const f = readFilters();
  const [query, setQuery] = useState<string>(f.query ?? "");
  const [setFilter, setSetFilter] = useState<string>(f.setFilter ?? "all");
  const [teamFilter, setTeamFilter] = useState<string>(f.teamFilter ?? "all");
  const [parallelFilter, setParallelFilter] = useState<string>(f.parallelFilter ?? "all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(f.inStockOnly ?? false);
  const [categoryFilter, setCategoryFilter] = useState<string>(f.categoryFilter ?? "all");
  const [sortBy, setSortBy] = useState<SortOption>(f.sortBy ?? "cardNumber");
  const [showFilters, setShowFilters] = useState(
    f.setFilter !== "all" || f.teamFilter !== "all" || f.parallelFilter !== "all" || f.inStockOnly
  );

  // Filter dropdown options — fetched once, re-fetched when set/category changes
  const [filterOptions, setFilterOptions] = useState<{ sets: string[]; teams: string[]; parallels: string[] }>({
    sets: [], teams: [], parallels: [],
  });

  // Persist filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("catalogue_filters", JSON.stringify({
      query, setFilter, teamFilter, parallelFilter, inStockOnly, sortBy, categoryFilter,
    }));
  }, [query, setFilter, teamFilter, parallelFilter, inStockOnly, sortBy, categoryFilter]);

  // Fetch filter dropdown options whenever set or category selection changes
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.rpc("get_catalogue_filters", {
      p_set_name: setFilter !== "all" ? setFilter : null,
      p_category: categoryFilter !== "all" ? categoryFilter : null,
    }).then(({ data }) => {
      if (data?.[0]) setFilterOptions({
        sets: data[0].sets ?? [],
        teams: data[0].teams ?? [],
        parallels: data[0].parallels ?? [],
      });
    });
  }, [setFilter, categoryFilter]);

  // Debounced search — avoid firing an RPC on every keystroke
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedQuery(query), 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [query]);

  // Build the RPC params object — used both for reset-and-fetch and load-more
  const rpcParams = useMemo(() => ({
    p_set_name:  setFilter !== "all" ? setFilter : null,
    p_team:      teamFilter !== "all" ? teamFilter : null,
    p_parallel:  parallelFilter !== "all" ? parallelFilter : null,
    p_category:  categoryFilter !== "all" ? categoryFilter : null,
    p_in_stock:  inStockOnly,
    p_search:    debouncedQuery.trim() || null,
    p_sort:      sortBy,
    p_limit:     PAGE_SIZE,
  }), [setFilter, teamFilter, parallelFilter, categoryFilter, inStockOnly, debouncedQuery, sortBy]);

  // Fetch a page at a given offset, optionally appending to existing cards
  const fetchPage = useCallback(async (currentOffset: number, append: boolean) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    if (!append) setIsLoading(true);
    else setLoadingMore(true);
    setLoadError(null);

    const { data, error } = await supabase.rpc("get_catalogue_page", {
      ...rpcParams,
      p_offset: currentOffset,
    });

    if (error) {
      setLoadError(error.message);
      setIsLoading(false);
      setLoadingMore(false);
      return;
    }

    const rows: RpcRow[] = data ?? [];
    const mapped = rows.map(rowToCard);
    const total = rows[0]?.total_count ?? 0;

    setTotalCount(total);
    setCards(prev => append ? [...prev, ...mapped] : mapped);
    setHasMore(currentOffset + rows.length < total);
    setIsLoading(false);
    setLoadingMore(false);
  }, [rpcParams]);

  // Reset to page 0 whenever any filter/sort changes
  useEffect(() => {
    setCards([]);
    setOffset(0);
    setHasMore(true);
    fetchPage(0, false);
  }, [fetchPage]);

  // Infinite scroll — load next page when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextOffset = offset + PAGE_SIZE;
          setOffset(nextOffset);
          fetchPage(nextOffset, true);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, offset, fetchPage]);

  // When a specific parallel is selected, swap the displayed card data to
  // that parallel's row. The RPC returns base cards only; parallel row data
  // is not available client-side, so we re-query for the specific parallel
  // card when the filter is active. For now we show the base card image and
  // swap price/stock from the parallel_names list — a full parallel-row swap
  // would require a separate query per card which is N+1. The parallel filter
  // already scopes the DB query to only cards that have that parallel, so the
  // correct cards are shown; the tile just displays the base image.
  const visibleCards = useMemo(() => cards, [cards]);

  const pillActive = { background: "#F26A21", color: "#fff", border: "1px solid #F26A21" };
  const pillInactive = { background: "white", color: "#374151", border: "1px solid rgba(0,0,0,0.1)" };

  return (
    <div className="space-y-4">

      {/* ══ HEADER PANEL ══════════════════════════════════════════════════ */}
      <section className="rounded-3xl p-6 sm:p-8 animate-fade-up" style={{ background: "#D6D0C4" }}>
        <div className="pointer-events-none absolute -top-12 right-12 h-40 w-40 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(8,123,117,0.4), transparent 70%)", filter: "blur(32px)" }} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "#F26A21" }}>Browse the Vault</span>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
              Browse Catalogue
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>
              {isLoading ? "Loading the vault..." : `${totalCount} card${totalCount !== 1 ? "s" : ""} available · Find your next chase card.`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(0,0,0,0.3)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none transition"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#1c1917" }}
            />
            {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: "rgba(0,0,0,0.3)" }}>✕</button>}
          </div>
        </div>

        {/* Filter pills */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All Sets", action: () => { setCategoryFilter("all"); setInStockOnly(false); }, active: categoryFilter === "all" && !inStockOnly },
              { label: "⚽ Football", action: () => setCategoryFilter(categoryFilter === "Football" ? "all" : "Football"), active: categoryFilter === "Football" },
              { label: "✨ Disney", action: () => setCategoryFilter(categoryFilter === "Disney" ? "all" : "Disney"), active: categoryFilter === "Disney" },
              { label: "📦 In Stock", action: () => setInStockOnly((v: boolean) => !v), active: inStockOnly },
            ].map((cat) => (
              <button key={cat.label} type="button" onClick={cat.action}
                className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-150"
                style={cat.active ? pillActive : pillInactive}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={setFilter} onChange={(e) => { setSetFilter(e.target.value); setTeamFilter("all"); setParallelFilter("all"); }}
              className="rounded-xl px-3 py-1.5 text-[13px] outline-none"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
              <option value="all">All Sets</option>
              {filterOptions.sets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={parallelFilter} onChange={(e) => setParallelFilter(e.target.value)}
              className="rounded-xl px-3 py-1.5 text-[13px] outline-none"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
              <option value="all">All Parallels</option>
              {filterOptions.parallels.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={() => setShowFilters((v: boolean) => !v)}
              className="rounded-xl px-3 py-1.5 text-[13px] font-semibold transition"
              style={showFilters ? pillActive : pillInactive}>
              Filters {showFilters ? "↑" : "↓"}
            </button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl px-3 py-1.5 text-[13px] outline-none"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
              <option value="cardNumber">Card #</option>
              <option value="playerName">Player</option>
              <option value="priceLow">Price ↑</option>
              <option value="priceHigh">Price ↓</option>
            </select>
          </div>
        </div>

        {showFilters && filterOptions.teams.length > 0 && (
          <div className="mt-3 animate-fade-up">
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
              className="rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
              <option value="all">All teams</option>
              {filterOptions.teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </section>

      {/* ══ LOADING ════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      )}

      {loadError && <div className="rounded-2xl p-6 text-sm" style={{ background: "rgba(220,38,38,0.1)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}>{loadError}</div>}

      {!isLoading && !loadError && visibleCards.length === 0 && (
        <EmptyState icon="🔍" title="No cards match your search" description="Try different keywords or clear your filters." actions={[{ label: "Browse all cards", href: "/catalogue", primary: true }]} />
      )}

      {/* ══ CARD GRID ══════════════════════════════════════════════════════ */}
      {!isLoading && !loadError && visibleCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 stagger-grid">
          {visibleCards.map((card) => {
            const inCartQty = cart.getItemQuantity(card.id);
            const hasStockCap = typeof card.availableQuantity === "number";
            const avail = hasStockCap ? Math.max(0, Number(card.availableQuantity)) : Infinity;
            const isOOS = hasStockCap ? avail <= 0 || card.stockStatus === "Out of stock" : card.stockStatus === "Out of stock";
            const maxed = hasStockCap && !isOOS && inCartQty >= avail;
            const justAdded = recentlyAddedCardId === card.id;
            const category = card.category || "";

            return (
              <article
                key={card.id}
                className="card-foil card-holo group relative overflow-hidden rounded-2xl transition-all duration-250 hover:-translate-y-1.5"
                style={{ background: "#D6D0C4", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty("--foil-x", `${x}%`);
                  e.currentTarget.style.setProperty("--foil-y", `${y}%`);
                  const tiltX = ((y - 50) / 50) * -4;
                  const tiltY = ((x - 50) / 50) * 4;
                  e.currentTarget.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
                }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                <Link
                  href={card.setSlug && card.cardSlug
                    ? `/catalogue/${card.setSlug}/${card.cardSlug}`
                    : buildPublicCardPath({ setName: card.setName, player: card.playerName, cardNumber: card.cardNumber })}
                  className="block"
                >
                  <div className="relative overflow-hidden" style={{ paddingBottom: "140%" }}>
                    {card.imageUrl ? (
                      <img
                        src={thumbUrl(card.imageUrl, 200)}
                        alt={`${card.playerName} card`}
                        loading="lazy"
                        decoding="async"
                        width={200}
                        height={280}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" style={{ objectPosition: "center", padding: "4px 0" }} />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                        style={{ background: category === "Disney" ? "linear-gradient(135deg, #1a1a2e, #16213e)" : "linear-gradient(135deg, #0d1a0d, #0a1a12)" }}>
                        <span className="text-4xl opacity-30">{category === "Disney" ? "✨" : "⚽"}</span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {!isOOS && (
                      <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: "rgba(8,123,117,0.9)", color: "white" }}>IN STOCK</span>
                    )}
                    {isOOS && (
                      <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: "rgba(220,38,38,0.85)", color: "white" }}>SOLD OUT</span>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-[13px] font-bold text-zinc-900">{card.playerName}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{card.setName}</p>
                    <p className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>#{card.cardNumber}{card.parallel ? ` · ${card.parallel}` : ""}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[14px] font-black" style={{ color: "#F26A21" }}>{formatGBP(card.price)}</p>
                    </div>
                  </div>
                </Link>

                <div className="px-3 pb-3">
                  <button
                    type="button"
                    disabled={isOOS || maxed}
                    onClick={(e) => {
                      if (isOOS || maxed) return;
                      const article = e.currentTarget.closest("article");
                      const img = article?.querySelector("img");
                      if (img) triggerFlyToCart(card.imageUrl || "", img.getBoundingClientRect());
                      else if (article) triggerFlyToCart(card.imageUrl || "", article.getBoundingClientRect());
                      setRecentlyAddedCardId(card.id);
                      window.setTimeout(() => setRecentlyAddedCardId((c) => c === card.id ? null : c), 1000);
                      cart.addToCart({ id: card.id, playerName: card.playerName, cardNumber: card.cardNumber, price: card.price, imageUrl: card.imageUrl, availableQuantity: hasStockCap ? avail : undefined });
                    }}
                    className={`w-full rounded-xl py-2 text-[13px] font-bold transition-all ${isOOS || maxed ? "cursor-not-allowed opacity-40" : justAdded ? "animate-added-chip" : "btn-gold"}`}
                    style={isOOS || maxed ? { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.3)" } : justAdded ? { background: "rgba(8,123,117,0.12)", color: "#087B75", border: "1px solid rgba(8,123,117,0.3)" } : {}}
                  >
                    {isOOS ? "Out of stock" : maxed ? "Max qty" : justAdded ? "✓ Added" : "Add to Cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
          ))}
        </div>
      )}
      {!hasMore && !isLoading && cards.length > 0 && (
        <p className="py-6 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>All {totalCount} cards loaded</p>
      )}
    </div>
  );
}
