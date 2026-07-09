"use client";

import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import type { CollectionEntry, CollectionSort } from "@/lib/collection/types";
import { computeCollectionStats } from "@/lib/collection/stats";
import getBrowserSupabase from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { formatGBP } from "@/lib/currency";
import Link from "next/link";

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const dur = 1200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{n}{suffix}</>;
}

export default function CollectionPage() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [publishedCardCount, setPublishedCardCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [setFilter, setSetFilter] = useState("all");
  const [sortBy, setSortBy] = useState<CollectionSort>("dateAddedDesc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (loading) return;
      if (!user?.id) { setEntries([]); setIsLoading(false); return; }
      const supabase = getBrowserSupabase();
      if (!supabase) { setLoadError("Service unavailable."); setIsLoading(false); return; }
      setIsLoading(true);
      const [{ data: rows, error }, { count }] = await Promise.all([
        supabase.from("user_collections").select("*, cards(*)").eq("user_id", user.id).order("date_added", { ascending: false }),
        supabase.from("cards").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      if (!mounted) return;
      if (error) { setLoadError("Unable to load your collection."); setEntries([]); }
      else setEntries((rows ?? []) as CollectionEntry[]);
      setPublishedCardCount(Number(count ?? 0));
      setIsLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [user?.id, loading]);

  const filterOptions = useMemo(() => ({
    sets: Array.from(new Set(entries.map((e) => e.cards?.set_name || "Unknown"))).sort(),
  }), [entries]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        const player = e.cards?.player || e.cards?.title || "";
        const setName = e.cards?.set_name || "";
        if (q && !player.toLowerCase().includes(q) && !setName.toLowerCase().includes(q)) return false;
        if (setFilter !== "all" && setName !== setFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "dateAddedDesc") return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
        if (sortBy === "dateAddedAsc") return new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
        if (sortBy === "valueHigh") return (Number(b.estimated_value ?? b.cards?.price ?? 0) * Number(b.quantity)) - (Number(a.estimated_value ?? a.cards?.price ?? 0) * Number(a.quantity));
        if (sortBy === "player") return (a.cards?.player || "").localeCompare(b.cards?.player || "");
        return (a.cards?.set_name || "").localeCompare(b.cards?.set_name || "");
      });
  }, [entries, search, setFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedEntries = filteredEntries.slice((safePage - 1) * pageSize, safePage * pageSize);
  const stats = useMemo(() => computeCollectionStats(entries, publishedCardCount), [entries, publishedCardCount]);

  const groupedByCard = useMemo(() => {
    const map = new Map<string, CollectionEntry[]>();
    for (const e of entries) { const cur = map.get(e.card_id) || []; cur.push(e); map.set(e.card_id, cur); }
    return map;
  }, [entries]);

  async function patchEntry(id: string, updates: Partial<CollectionEntry>) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    setBusyRowId(id);
    const { error } = await supabase.from("user_collections").update(updates).eq("id", id).eq("user_id", user?.id);
    if (!error) setEntries((cur) => cur.map((e) => e.id === id ? { ...e, ...updates } : e));
    setBusyRowId(null);
  }

  async function deleteEntry(id: string) {
    const supabase = getBrowserSupabase(); if (!supabase) return;
    setBusyRowId(id);
    const { error } = await supabase.from("user_collections").delete().eq("id", id).eq("user_id", user?.id);
    if (!error) setEntries((cur) => cur.filter((e) => e.id !== id));
    setBusyRowId(null);
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-up">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 280 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #060e08 0%, #0a1a0f 40%, #0d0d0f 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 20% -10%, rgba(34,197,94,0.12), transparent)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 90% 110%, rgba(200,155,60,0.08), transparent)" }} />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

          <div className="relative p-8 sm:p-12">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22c55e]">My Collection</span>
                </div>
                <h1 className="text-3xl font-black text-white sm:text-4xl">
                  {loading || isLoading ? "Loading vault..." : `${stats.totalCards} cards in your vault`}
                </h1>
                <p className="text-[14px] text-[rgba(232,230,225,0.4)]">
                  {stats.uniqueCards} unique · {stats.completionPct}% completion
                </p>
              </div>
              {!loading && !isLoading && user && (
                <div className="rounded-2xl px-6 py-4 text-right" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(34,197,94,0.7)]">Collection Value</p>
                  <p className="mt-1 text-3xl font-black text-white">
                    <AnimatedCounter value={Math.round(stats.collectionValue * 100) / 100} prefix="£" />
                  </p>
                </div>
              )}
            </div>

            {!loading && !isLoading && user && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Cards", value: stats.totalCards, color: "text-white" },
                  { label: "Unique", value: stats.uniqueCards, color: "text-[#4ade80]" },
                  { label: "Completion", value: stats.completionPct, suffix: "%", color: "text-[#f5d97a]" },
                  { label: "This Week", value: stats.recentlyAdded, color: "text-[#60a5fa]" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(232,230,225,0.3)]">{s.label}</p>
                    <p className={`mt-1 text-2xl font-black ${s.color}`}>
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Not signed in ─────────────────────────────────────────────── */}
        {!loading && !user && (
          <div className="rounded-3xl p-16 text-center" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border-hi)" }}>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: "rgba(200,155,60,0.08)", border: "1px solid rgba(200,155,60,0.15)" }}>📦</div>
            <h2 className="text-xl font-black text-[rgba(232,230,225,0.9)]">Sign in to build your vault</h2>
            <p className="mt-2 text-[13px] text-[rgba(232,230,225,0.4)]">Track every card, monitor value, and complete sets.</p>
            <Link href="/login" className="btn-gold mt-6 inline-flex rounded-full px-6 py-3 text-sm">Sign in →</Link>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {(loading || isLoading) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-2xl" />
            ))}
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl p-6 text-sm text-[#f87171]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>{loadError}</div>
        )}

        {!loading && !isLoading && user && !loadError && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl p-4" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player, set..."
                className="min-w-[200px] flex-1 rounded-xl py-2.5 pl-4 pr-4 text-sm text-[rgba(232,230,225,0.9)] outline-none placeholder:text-[rgba(232,230,225,0.25)] transition"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)} className="rounded-xl px-3 py-2.5 text-sm text-[rgba(232,230,225,0.7)] outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <option value="all">All sets</option>
                {filterOptions.sets.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as CollectionSort)} className="rounded-xl px-3 py-2.5 text-sm text-[rgba(232,230,225,0.7)] outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <option value="dateAddedDesc">Newest first</option>
                <option value="dateAddedAsc">Oldest first</option>
                <option value="valueHigh">Highest value</option>
                <option value="player">Player name</option>
                <option value="set">Set name</option>
              </select>
              <div className="ml-auto flex gap-1.5">
                {(["grid", "list"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setViewMode(m)} className="rounded-xl px-3 py-2 text-sm font-semibold transition" style={{ background: viewMode === m ? "rgba(200,155,60,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${viewMode === m ? "rgba(200,155,60,0.25)" : "rgba(255,255,255,0.06)"}`, color: viewMode === m ? "#f5d97a" : "rgba(232,230,225,0.5)" }}>
                    {m === "grid" ? "⊞" : "≡"}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty */}
            {pagedEntries.length === 0 && (
              <div className="rounded-3xl p-16 text-center" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: "rgba(255,255,255,0.04)" }}>🔍</div>
                <p className="text-lg font-black text-[rgba(232,230,225,0.7)]">No cards found</p>
                <Link href="/catalogue" className="mt-5 inline-flex rounded-full border border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.08)] px-5 py-2.5 text-sm font-bold text-[#f5d97a] transition hover:bg-[rgba(200,155,60,0.14)]">Browse catalogue →</Link>
              </div>
            )}

            {/* Grid */}
            {viewMode === "grid" && pagedEntries.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-grid">
                {pagedEntries.map((entry) => {
                  const player = entry.cards?.player || entry.cards?.title || "Unknown";
                  const setName = entry.cards?.set_name || "Unknown set";
                  const duplicates = groupedByCard.get(entry.card_id)?.length || 0;
                  const value = Number(entry.estimated_value ?? entry.cards?.price ?? 0);
                  return (
                    <article key={entry.id} className="card-foil card-lift group relative overflow-hidden rounded-2xl" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
                      <div className="relative h-48 overflow-hidden" style={{ background: "linear-gradient(135deg, #141418, #1c1c22)" }}>
                        {entry.cards?.image_url
                          ? <img src={entry.cards.image_url} alt={player} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                          : <div className="flex h-full items-center justify-center text-3xl opacity-10">🃏</div>
                        }
                        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <span className="badge-owned rounded-full px-2 py-0.5 text-[9px] font-black">Owned</span>
                          {duplicates > 1 && <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-[#0d0d0f]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>{duplicates}×</span>}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="truncate text-sm font-black text-[rgba(232,230,225,0.9)]">{player}</p>
                        <p className="mt-0.5 truncate text-[11px] text-[rgba(232,230,225,0.4)]">{setName} · #{entry.cards?.card_number || "?"}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-[rgba(232,230,225,0.35)]">Qty {entry.quantity} · {entry.condition}</span>
                          <span className="text-sm font-black text-[#f5d97a]">{formatGBP(value)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <button type="button" disabled={busyRowId === entry.id} onClick={() => patchEntry(entry.id, { favourite: !entry.favourite })} className="rounded-full px-2 py-1 text-[10px] font-bold transition" style={{ background: entry.favourite ? "rgba(200,155,60,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${entry.favourite ? "rgba(200,155,60,0.25)" : "rgba(255,255,255,0.06)"}`, color: entry.favourite ? "#f5d97a" : "rgba(232,230,225,0.4)" }}>
                            {entry.favourite ? "★" : "☆"}
                          </button>
                          <button type="button" disabled={busyRowId === entry.id} onClick={() => patchEntry(entry.id, { quantity: Math.max(1, Number(entry.quantity) + 1) })} className="rounded-full px-2 py-1 text-[10px] font-bold text-[rgba(232,230,225,0.4)] transition hover:text-[rgba(232,230,225,0.8)]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>+</button>
                          <button type="button" disabled={busyRowId === entry.id || Number(entry.quantity) <= 1} onClick={() => patchEntry(entry.id, { quantity: Math.max(1, Number(entry.quantity) - 1) })} className="rounded-full px-2 py-1 text-[10px] font-bold text-[rgba(232,230,225,0.4)] transition hover:text-[rgba(232,230,225,0.8)] disabled:opacity-20" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>−</button>
                          <button type="button" disabled={busyRowId === entry.id} onClick={() => deleteEntry(entry.id)} className="rounded-full px-2 py-1 text-[10px] font-bold text-[rgba(239,68,68,0.6)] transition hover:text-[#f87171]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>Remove</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* List */}
            {viewMode === "list" && pagedEntries.length > 0 && (
              <div className="overflow-hidden rounded-2xl" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
                <table className="w-full text-sm">
                  <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-[0.15em] text-[rgba(232,230,225,0.3)]">
                      {["Card", "Set", "Qty", "Condition", "Value", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEntries.map((entry) => {
                      const player = entry.cards?.player || entry.cards?.title || "Unknown";
                      return (
                        <tr key={entry.id} className="transition" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                          <td className="px-4 py-3 font-bold text-[rgba(232,230,225,0.8)]">{player} <span className="text-[rgba(232,230,225,0.3)]">#{entry.cards?.card_number || "?"}</span></td>
                          <td className="px-4 py-3 text-[rgba(232,230,225,0.4)]">{entry.cards?.set_name || "Unknown"}</td>
                          <td className="px-4 py-3 text-[rgba(232,230,225,0.6)]">{entry.quantity}</td>
                          <td className="px-4 py-3 text-[rgba(232,230,225,0.4)]">{entry.condition}</td>
                          <td className="px-4 py-3 font-black text-[#f5d97a]">{formatGBP(Number(entry.estimated_value ?? entry.cards?.price ?? 0))}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => deleteEntry(entry.id)} className="rounded-full px-2 py-1 text-[10px] font-bold text-[rgba(239,68,68,0.6)] transition hover:text-[#f87171]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[rgba(232,230,225,0.35)]">Page {safePage} of {pageCount} · {filteredEntries.length} cards</p>
                <div className="flex gap-2">
                  <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-full px-4 py-2 text-sm font-semibold text-[rgba(232,230,225,0.5)] transition hover:text-[rgba(232,230,225,0.8)] disabled:opacity-25" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>← Prev</button>
                  <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded-full px-4 py-2 text-sm font-semibold text-[rgba(232,230,225,0.5)] transition hover:text-[rgba(232,230,225,0.8)] disabled:opacity-25" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
