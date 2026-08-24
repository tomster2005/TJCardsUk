"use client";

import { Layout } from "@/components/Layout";
import getBrowserSupabase from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatGBP } from "@/lib/currency";
import { thumbUrl } from "@/lib/images";

type SetSlide = { name: string; cards: { image_url: string | null; player: string; card_number: string }[] };

type DashboardStats = {
  totalCards: number;
  totalStock: number;
  sets: number;
  binderSets: number;
  recentCards: { id: string; player: string; set_name: string; card_number: string; image_url: string | null; price: number }[];
  allSets: SetSlide[];
};

type CollectionStats = {
  collected: number;
  total: number;
  pct: number;
};

function AnimatedCounter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const dur = 1100;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{n}</>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [collection, setCollection] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardOffset, setCardOffset] = useState(0);
  const [setSlide, setSetSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const [sliding, setSliding] = useState(false);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) { setLoading(false); return; }

      const { data: cards } = await supabase
        .from("cards")
        .select("id, player, set_name, card_number, image_url, stock, status, created_at, price");

      const { data: binderSets } = await supabase.from("binder_sets").select("id, title");

      const allCards = cards || [];
      const setNames = new Set(allCards.map(c => c.set_name));
      const totalStock = allCards.reduce((sum, c) => sum + (c.stock || 0), 0);
      const recent = [...allCards].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 12);

      const allSets: SetSlide[] = [];
      for (const setName of Array.from(setNames)) {
        const setCards = allCards.filter(c => c.set_name === setName && c.image_url).slice(0, 3);
        if (setCards.length > 0) allSets.push({ name: setName, cards: setCards });
      }

      setStats({ totalCards: allCards.length, totalStock, sets: setNames.size, binderSets: (binderSets || []).length, recentCards: recent, allSets });

      if (user) {
        const [, progressRes, hiddenRes] = await Promise.all([
          supabase.from("binder_checklist").select("id", { count: "exact", head: true }),
          supabase.from("user_binder_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("user_binder_hidden").select("set_id").eq("user_id", user.id),
        ]);
        const hiddenSetIds = new Set((hiddenRes.data || []).map((r: any) => r.set_id));
        const { data: activeSets } = await supabase.from("binder_sets").select("id").eq("is_active", true);
        const collectingSetIds = (activeSets || []).map((s: any) => s.id).filter((id: string) => !hiddenSetIds.has(id));
        let total = 0;
        if (collectingSetIds.length > 0) {
          const { count } = await supabase.from("binder_checklist").select("id", { count: "exact", head: true }).in("set_id", collectingSetIds);
          total = count ?? 0;
        }
        const collected = progressRes.count ?? 0;
        const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
        setCollection({ collected, total, pct });
      }

      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!stats?.allSets.length) return;
    slideTimer.current = setInterval(() => goSlide("right"), 4000);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [stats?.allSets.length, setSlide]);

  function goSlide(dir: "left" | "right") {
    if (!stats?.allSets.length || sliding) return;
    setSlideDir(dir);
    setSliding(true);
    setTimeout(() => {
      setSetSlide(i => {
        const len = stats.allSets.length;
        return dir === "right" ? (i + 1) % len : (i - 1 + len) % len;
      });
      setSliding(false);
    }, 300);
  }

  function manualSlide(dir: "left" | "right") {
    if (slideTimer.current) clearInterval(slideTimer.current);
    goSlide(dir);
  }

  const circumference = 2 * Math.PI * 44;
  const completionPct = collection?.pct ?? 0;
  const dashOffset = circumference - (completionPct / 100) * circumference;
  const visibleCards = stats?.recentCards.slice(cardOffset, cardOffset + 8) ?? [];

  return (
    <Layout>
      <div className="space-y-4">

        {/* ══ TOP ROW: Hero + Featured Set ══════════════════════════════════ */}
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">

          {/* Hero — cream panel */}
          <section className="relative overflow-hidden rounded-3xl animate-fade-up" style={{ background: "#D6D0C4", height: 420 }}>
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -bottom-16 right-1/4 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(242,106,33,0.35), transparent 70%)", filter: "blur(40px)" }} />
            <div className="pointer-events-none absolute -bottom-8 right-8 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(8,123,117,0.4), transparent 70%)", filter: "blur(32px)" }} />

            <div className="relative flex flex-col lg:flex-row gap-6 p-7 sm:p-8">
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "rgba(0,0,0,0.35)" }}>Store active</span>
                </div>

                <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl" style={{ lineHeight: 1.05 }}>
                  Every card.<br />
                  <span style={{ color: "#F26A21" }}>Every moment.</span><br />
                  <span style={{ color: "#087B75" }}>Preserved.</span>
                </h1>

                <p className="mt-4 max-w-xs text-[14px] leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
                  Browse, collect and track your favourite trading cards — all in one place.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-bold">
                    Browse Cards →
                  </Link>
                  <Link href="/binder"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold transition hover:-translate-y-0.5"
                    style={{ border: "1px solid rgba(8,123,117,0.3)", background: "rgba(8,123,117,0.06)", color: "#087B75" }}>
                    Open Binder
                  </Link>
                </div>
              </div>

              {/* Right — stats card */}
              {!loading && stats && (
                <div className="lg:w-64 rounded-2xl p-5 shrink-0" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(12px)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "rgba(0,0,0,0.35)" }}>Your Collection</p>
                  <div className="space-y-3">
                    {[
                      { label: "Total Cards", value: stats.totalCards },
                      { label: "Total Stock", value: stats.totalStock },
                      { label: "Sets", value: stats.sets },
                      { label: "Binder Sets", value: stats.binderSets },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.4)" }}>{s.label}</span>
                        <span className="text-xl font-black text-zinc-900"><AnimatedCounter value={s.value} /></span>
                      </div>
                    ))}
                    {/* Ring */}
                    <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <svg width="52" height="52" viewBox="0 0 100 100" className="shrink-0">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#087B75" strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 50 50)"
                          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 4px rgba(8,123,117,0.5))" }} />
                        <text x="50" y="55" textAnchor="middle" style={{ fontSize: 22, fontWeight: 900, fill: "#1c1917" }}>{completionPct}%</text>
                      </svg>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.4)" }}>Collected</p>
                        <p className="text-lg font-black" style={{ color: "#087B75" }}>
                          {collection?.collected ?? 0}
                          <span className="text-[11px] font-medium" style={{ color: "rgba(0,0,0,0.3)" }}>/{collection?.total ?? 0}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sets Slideshow */}
          {stats?.allSets.length ? (() => {
            const slide = stats.allSets[setSlide];
            return (
              <section className="relative rounded-3xl animate-fade-up" style={{ background: "linear-gradient(145deg, #0a1a1a, #0d2020)", border: "1px solid rgba(8,123,117,0.2)", height: 420 }}>
                <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(242,106,33,0.4), transparent 70%)", filter: "blur(32px)" }} />
                <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(8,123,117,0.3), transparent 70%)", filter: "blur(24px)" }} />
                <div className="absolute inset-0 p-7 pb-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(8,163,155,0.7)" }}>Sets Available</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 mr-1">
                        {stats.allSets.map((_, i) => (
                          <button key={i}
                            onClick={() => { if (slideTimer.current) clearInterval(slideTimer.current); setSlideDir(i > setSlide ? "right" : "left"); setSetSlide(i); }}
                            className="rounded-full transition-all duration-300"
                            style={{ width: i === setSlide ? 16 : 6, height: 6, background: i === setSlide ? "#F26A21" : "rgba(255,255,255,0.2)" }}
                          />
                        ))}
                      </div>
                      <button onClick={() => manualSlide("left")}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                        style={{ border: "1px solid rgba(255,255,255,0.15)" }}>←</button>
                      <button onClick={() => manualSlide("right")}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                        style={{ border: "1px solid rgba(255,255,255,0.15)" }}>→</button>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0" style={{
                    opacity: sliding ? 0 : 1,
                    transform: sliding ? `translateX(${slideDir === "right" ? "20px" : "-20px"})` : "translateX(0)",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                  }}>
                    <h2 className="text-3xl font-black text-white leading-tight truncate">{slide.name}</h2>
                    <p className="mt-2 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>{setSlide + 1} of {stats.allSets.length} sets</p>
                    <Link href="/catalogue"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5 self-start"
                      style={{ background: "#087B75", boxShadow: "0 4px 16px rgba(8,123,117,0.4)" }}>
                      Explore Series →
                    </Link>
                    <div className="mt-auto pt-4 flex items-end justify-end gap-2 overflow-visible pb-6">
                      {slide.cards.slice(0, 3).map((card, i) => (
                        <div key={i} className="overflow-hidden rounded-xl shrink-0" style={{
                          width: i === 1 ? 100 : 80, height: i === 1 ? 140 : 112,
                          transform: i === 0 ? "rotate(-6deg) translateY(8px)" : i === 2 ? "rotate(6deg) translateY(8px)" : "none",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          position: "relative", zIndex: i === 1 ? 2 : 1,
                        }}>
                          {card.image_url
                            ? <img
                                src={thumbUrl(card.image_url, 100)}
                                alt={card.player}
                                loading="lazy"
                                decoding="async"
                                width={100}
                                height={140}
                                className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center text-2xl" style={{ background: "#131a1a" }}>🃏</div>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })() : null}
        </div>

        {/* ══ RECENTLY ADDED ════════════════════════════════════════════════ */}
        {!loading && stats && stats.recentCards.length > 0 && (
          <section className="animate-fade-up rounded-3xl p-6" style={{ background: "#D6D0C4", animationDelay: "80ms" }}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[16px] font-bold text-zinc-900">Recently Added</h2>
                <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={{ background: "rgba(8,123,117,0.12)", color: "#087B75", border: "1px solid rgba(8,123,117,0.2)" }}>New</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCardOffset(Math.max(0, cardOffset - 8))} disabled={cardOffset === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-30"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
                  ←
                </button>
                <button onClick={() => setCardOffset(Math.min(stats.recentCards.length - 8, cardOffset + 8))}
                  disabled={cardOffset + 8 >= stats.recentCards.length}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-30"
                  style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
                  →
                </button>
                <Link href="/catalogue" className="text-[12px] font-semibold ml-2 transition" style={{ color: "#F26A21" }}>
                  View all →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
              {visibleCards.map((card) => (
                <Link key={card.id} href="/catalogue"
                  className="group relative overflow-hidden rounded-2xl transition-all duration-250 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="relative overflow-hidden" style={{ paddingBottom: "140%" }}>
                    {card.image_url
                      ? <img
                          src={thumbUrl(card.image_url, 80)}
                          alt={card.player}
                          loading="lazy"
                          decoding="async"
                          width={80}
                          height={112}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                      : <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#e8e4dc" }}><span className="text-2xl opacity-20">🃏</span></div>
                    }
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="truncate text-[10px] font-bold text-white leading-tight">#{card.card_number} {card.player}</p>
                      <p className="truncate text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{card.set_name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ QUICK ACTIONS ═════════════════════════════════════════════════ */}
        <section className="animate-fade-up rounded-3xl p-6" style={{ background: "#D6D0C4", animationDelay: "160ms" }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/catalogue", icon: "🔍", label: "Browse Catalogue", sub: "Explore all available cards", bg: "#087B75" },
              { href: "/discover", icon: "📦", label: "Discover Sets", sub: "View all available sets", bg: "#F26A21" },
              { href: "/binder", icon: "📖", label: "Open Binder", sub: "Your premium card album", bg: "#087B75" },
              { href: "/catalogue", icon: "⭐", label: "New Arrivals", sub: "Latest cards in stock", bg: "#F26A21" },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className="group flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl text-white"
                  style={{ background: item.bg, boxShadow: `0 4px 12px ${item.bg}40` }}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900">{item.label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{item.sub}</p>
                </div>
                <span className="ml-auto text-zinc-300 group-hover:text-zinc-500 transition">→</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
