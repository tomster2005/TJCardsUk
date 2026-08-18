"use client";

import { Layout } from "@/components/Layout";
import getBrowserSupabase from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

type DashboardStats = {
  totalCards: number;
  totalStock: number;
  sets: number;
  binderSets: number;
  recentCards: { id: string; player: string; set_name: string; card_number: string; image_url: string | null }[];
};

type CollectionStats = {
  collected: number;
  total: number;
  pct: number;
};

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
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
  return <>{n}{suffix}</>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [collection, setCollection] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) { setLoading(false); return; }

      const { data: cards } = await supabase
        .from("cards")
        .select("id, player, set_name, card_number, image_url, stock, status, created_at");

      const { data: binderSets } = await supabase
        .from("binder_sets")
        .select("id, title");

      const allCards = cards || [];
      const setNames = new Set(allCards.map(c => c.set_name));
      const totalStock = allCards.reduce((sum, c) => sum + (c.stock || 0), 0);

      const recent = [...allCards]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 8);

      setStats({
        totalCards: allCards.length,
        totalStock,
        sets: setNames.size,
        binderSets: (binderSets || []).length,
        recentCards: recent,
      });

      // User collection progress — total checklist entries vs how many they've marked collected
      if (user) {
        const [checklistRes, progressRes, hiddenRes] = await Promise.all([
          supabase.from("binder_checklist").select("id", { count: "exact", head: true }),
          supabase.from("user_binder_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("user_binder_hidden").select("set_id").eq("user_id", user.id),
        ]);
        const hiddenSetIds = new Set((hiddenRes.data || []).map((r: any) => r.set_id));
        // Get all active binder set ids
        const { data: activeSets } = await supabase.from("binder_sets").select("id").eq("is_active", true);
        const collectingSetIds = (activeSets || []).map((s: any) => s.id).filter((id: string) => !hiddenSetIds.has(id));
        // Count checklist entries only for sets the user is collecting
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

  const circumference = 2 * Math.PI * 44;
  const completionPct = collection?.pct ?? 0;
  const dashOffset = circumference - (completionPct / 100) * circumference;

  return (
    <Layout>
      <div className="space-y-10">

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <section className="animate-fade-up relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(145deg, #fffdf8 0%, #fdf8f0 40%, #faf5ed 100%)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(200,155,60,0.08)" }}>
          <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.15), transparent 70%)" }} />

          <div className="relative p-6 sm:p-8">
            {/* Store active */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Store active</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl font-display" style={{ lineHeight: 1.1 }}>
              Every card.<br />
              <span className="text-gold">Every moment.</span><br />
              <span className="text-zinc-300">Preserved.</span>
            </h1>

            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-zinc-500">
              Browse, collect and track your favourite trading cards — all in one place.
            </p>

            {/* Stats row — includes completion ring */}
            {loading ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            ) : stats && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: "Total Cards", value: stats.totalCards },
                  { label: "Total Stock", value: stats.totalStock },
                  { label: "Sets", value: stats.sets },
                  { label: "Binder Sets", value: stats.binderSets },
                ].map((s) => (
                  <div key={s.label} className="relative pl-3">
                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: "#c89b3c", opacity: 0.6 }} />
                    <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">{s.label}</p>
                    <p className="mt-0.5 text-xl font-black tabular-nums text-amber-700">
                      <AnimatedCounter value={s.value} />
                    </p>
                  </div>
                ))}
                {/* Completion ring inline with stats */}
                <div className="flex items-center gap-3 pl-3">
                  <svg width="72" height="72" viewBox="0 0 100 100" className="flex-shrink-0">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#f0ede8" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="44"
                      fill="none"
                      stroke="url(#goldGradDash)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
                    />
                    <defs>
                      <linearGradient id="goldGradDash" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f5d97a" />
                        <stop offset="100%" stopColor="#c89b3c" />
                      </linearGradient>
                    </defs>
                    <text x="50" y="55" textAnchor="middle" style={{ fontSize: 22, fontWeight: 900, fill: "#78716c" }}>
                      {completionPct}%
                    </text>
                  </svg>
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">Collected</p>
                    <p className="text-[13px] font-black text-amber-700">{collection?.collected ?? 0}<span className="text-[10px] font-medium text-zinc-400">/{collection?.total ?? 0}</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px]">
                Browse Cards →
              </Link>
              <Link href="/binder" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-[13px] font-semibold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-800">
                Open Binder
              </Link>
            </div>
          </div>
        </section>

        {/* ══ RECENT CARDS ═══════════════════════════════════════════════ */}
        {!loading && stats && stats.recentCards.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-bold text-zinc-800">Recently Added</h2>
                <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide badge-owned">New</span>
              </div>
              <Link href="/catalogue" className="text-[12px] font-semibold text-amber-700 hover:text-amber-900 transition">
                View all →
              </Link>
            </div>
            <div className="scroll-row gap-3">
              {stats.recentCards.map((card) => (
                <Link
                  key={card.id}
                  href="/catalogue"
                  className="group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)]"
                  style={{ width: 156, boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}
                >
                  <div className="relative overflow-hidden" style={{ height: 210 }}>
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.player} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f5f1ea] to-[#ede8df]">
                        <span className="text-3xl opacity-20">🃏</span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p className="truncate text-[11px] font-semibold text-white leading-tight">#{card.card_number} {card.player}</p>
                      <p className="truncate text-[9px] text-white/50 mt-0.5">{card.set_name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ QUICK ACTIONS ═══════════════════════════════════════════════ */}
        <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/catalogue", icon: "🔍", label: "Browse Catalogue", sub: "View all available cards" },
              { href: "/discover", icon: "📦", label: "Discover Sets", sub: "View all available sets" },
              { href: "/binder", icon: "📖", label: "Open Binder", sub: "Your premium card album" },
              { href: "/catalogue", icon: "⭐", label: "New Arrivals", sub: "Latest cards in stock" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3.5 rounded-xl border border-[rgba(200,155,60,0.12)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(200,155,60,0.3)] hover:shadow-[0_4px_16px_rgba(200,155,60,0.1)]"
                style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)" }}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "rgba(200,155,60,0.1)", border: "1px solid rgba(200,155,60,0.2)" }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">{item.label}</p>
                  <p className="text-[10px] text-zinc-400">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
