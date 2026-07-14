"use client";

import { Layout } from "@/components/Layout";
import getBrowserSupabase from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type DashboardStats = {
  totalCards: number;
  totalStock: number;
  sets: number;
  binderSets: number;
  binderCompletion: number;
  recentCards: { id: string; player: string; set_name: string; card_number: string; image_url: string | null }[];
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
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

      const { data: checklist } = await supabase
        .from("binder_checklist")
        .select("set_id, card_number");

      const allCards = cards || [];
      const setNames = new Set(allCards.map(c => c.set_name));
      const totalStock = allCards.reduce((sum, c) => sum + (c.stock || 0), 0);

      const recent = [...allCards]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 8);

      // Calculate binder completion: checklist entries that have a matching card in stock
      const allChecklist = checklist || [];
      const allBinders = binderSets || [];
      const cardLookup = new Set(allCards.map(c => `${c.set_name}::${c.card_number}`));
      const matched = allChecklist.filter(entry => {
        const binder = allBinders.find(b => b.id === entry.set_id);
        if (!binder) return false;
        return cardLookup.has(`${binder.title}::${entry.card_number}`);
      });
      const binderCompletion = allChecklist.length > 0 ? Math.round((matched.length / allChecklist.length) * 100) : 0;

      setStats({
        totalCards: allCards.length,
        totalStock,
        sets: setNames.size,
        binderSets: allBinders.length,
        binderCompletion,
        recentCards: recent,
      });
      setLoading(false);
    }
    load();
  }, []);

  const circumference = 2 * Math.PI * 44;
  const completionPct = stats?.binderCompletion ?? 0;
  const dashOffset = circumference - (completionPct / 100) * circumference;

  return (
    <Layout>
      <div className="space-y-14">

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <section className="animate-fade-up relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(145deg, #fffdf8 0%, #fdf8f0 40%, #faf5ed 100%)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(200,155,60,0.08)" }}>
          <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.15), transparent 70%)" }} />

          <div className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_280px] lg:p-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Store active</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl font-display" style={{ lineHeight: 1.1 }}>
                Every card.<br />
                <span className="text-gold">Every moment.</span><br />
                <span className="text-zinc-300">Preserved.</span>
              </h1>

              <p className="max-w-md text-[14px] leading-relaxed text-zinc-500">
                Football legends. Disney magic. Your store inventory at a glance — beautifully organised, always growing.
              </p>

              {/* Stats */}
              {loading ? (
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-lg" />
                  ))}
                </div>
              ) : stats && (
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                  {[
                    { label: "Total Cards", value: stats.totalCards, accent: "#c89b3c", color: "text-amber-700" },
                    { label: "Total Stock", value: stats.totalStock, accent: "#16a34a", color: "text-emerald-700" },
                    { label: "Sets", value: stats.sets, accent: "#3b5bdb", color: "text-blue-700" },
                    { label: "Binder Sets", value: stats.binderSets, accent: "#9333ea", color: "text-purple-700" },
                  ].map((s) => (
                    <div key={s.label} className="relative pl-3">
                      <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: s.accent, opacity: 0.6 }} />
                      <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">{s.label}</p>
                      <p className={`mt-0.5 text-xl font-black tabular-nums ${s.color}`}>
                        <AnimatedCounter value={s.value} />
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px]">
                  Browse Cards →
                </Link>
                <Link href="/binder" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-[13px] font-semibold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-800">
                  Open Binder
                </Link>
              </div>
            </div>

            {/* Right — stock ring */}
            {!loading && stats && (
              <div className="hidden flex-col items-center gap-5 animate-fade-up lg:flex" style={{ animationDelay: "120ms" }}>
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#f0ede8" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke="url(#goldGradDash)"
                    strokeWidth="6"
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
                  <text x="50" y="48" textAnchor="middle" style={{ fontSize: 16, fontWeight: 900, fill: "#78716c" }}>
                    {completionPct}%
                  </text>
                  <text x="50" y="63" textAnchor="middle" style={{ fontSize: 7, fill: "#a8a29e", fontWeight: 600, letterSpacing: "0.12em" }}>
                    COMPLETE
                  </text>
                </svg>
                <p className="text-[11px] text-zinc-400">{stats.binderSets} binder set{stats.binderSets !== 1 ? "s" : ""} created</p>
              </div>
            )}
          </div>


        </section>

        {/* ══ RECENT CARDS ═══════════════════════════════════════════════ */}
        {!loading && stats && stats.recentCards.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[15px] font-bold text-zinc-800">Recently Added</h2>
              <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide badge-owned">New</span>
            </div>
            <div className="scroll-row gap-3">
              {stats.recentCards.map((card) => (
                <article
                  key={card.id}
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
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ══ QUICK ACTIONS ═══════════════════════════════════════════════ */}
        <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/catalogue", icon: "🔍", label: "Browse Catalogue", sub: "View all available cards", tint: "rgba(200,155,60,0.06)", hover: "rgba(200,155,60,0.1)" },
              { href: "/discover", icon: "📦", label: "Discover Sets", sub: "View all available sets", tint: "rgba(22,163,74,0.05)", hover: "rgba(22,163,74,0.09)" },
              { href: "/binder", icon: "📖", label: "Open Binder", sub: "Your premium card album", tint: "rgba(59,91,219,0.05)", hover: "rgba(59,91,219,0.09)" },
              { href: "/missing-cards", icon: "◎", label: "Missing Cards", sub: "Cards not yet in stock", tint: "rgba(147,51,234,0.05)", hover: "rgba(147,51,234,0.09)" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3.5 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: item.tint, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = item.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = item.tint)}
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-zinc-700 group-hover:text-zinc-900">{item.label}</p>
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
