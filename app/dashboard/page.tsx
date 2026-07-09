"use client";

import { Layout } from "@/components/Layout";
import { useCollection } from "@/contexts/CollectionContext";
import { getCollectionSummary } from "@/lib/collection/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ShowcaseCard = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge: string;
  badgeType: "owned" | "wishlist" | "missing";
  isRare?: boolean;
  progress?: number;
};

function toShowcaseCard(card: ReturnType<typeof useCollection>["pockets"][number]): ShowcaseCard {
  return {
    id: card.id,
    title: `#${card.cardNumber} ${card.playerName}`,
    subtitle: `${card.teamName} · ${card.parallelName}`,
    imageUrl: card.imageUrl,
    badge: card.status === "owned" ? "Owned" : card.status === "wishlist" ? "Wishlist" : "Missing",
    badgeType: card.status === "owned" ? "owned" : card.status === "wishlist" ? "wishlist" : "missing",
    isRare: card.rarityName?.toLowerCase().includes("rare") || card.rarityName?.toLowerCase().includes("holo"),
  };
}

function ensureLength(source: ShowcaseCard[], fallback: ShowcaseCard[], min: number) {
  if (source.length >= min) return source.slice(0, min);
  if (!fallback.length) return source;
  const out = [...source];
  for (let i = 0; out.length < min; i++) out.push(fallback[i % fallback.length]);
  return out;
}

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

function VaultCard({ card, index }: { card: ShowcaseCard; index: number }) {
  const heights = [176, 200, 184, 216, 192];
  const h = heights[index % heights.length];
  return (
    <article
      className={`card-foil card-lift group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl ${card.isRare ? "card-rare" : ""}`}
      style={{ width: 148, boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative overflow-hidden" style={{ height: h }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.title} className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-[1.08]" />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: "linear-gradient(135deg, #1c1c22, #2a2a32)" }}>
            <span className="text-4xl opacity-20">🃏</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
        {card.isRare && (
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.12), transparent 50%, rgba(59,130,246,0.08))" }} />
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${card.badgeType === "owned" ? "badge-owned" : card.badgeType === "wishlist" ? "badge-wishlist" : "bg-[rgba(0,0,0,0.5)] text-[rgba(232,230,225,0.6)] border border-[rgba(255,255,255,0.1)]"}`}>
          {card.badge}
        </span>
        {card.isRare && (
          <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white">✦</span>
        )}
      </div>
      <div className="p-2.5" style={{ background: "var(--vault-raised)" }}>
        <p className="truncate text-[12px] font-semibold text-[rgba(232,230,225,0.9)]">{card.title}</p>
        <p className="mt-0.5 truncate text-[10px] text-[rgba(232,230,225,0.4)]">{card.subtitle}</p>
        {card.progress !== undefined && (
          <div className="mt-2 progress-track h-1">
            <div className="progress-fill h-full" style={{ width: `${card.progress}%` }} />
          </div>
        )}
      </div>
    </article>
  );
}

function CardRow({ title, label, labelClass, cards, showProgress, delay }: {
  title: string; label: string; labelClass: string;
  cards: ShowcaseCard[]; showProgress?: boolean; delay: number;
}) {
  if (!cards.length) return null;
  const display = showProgress ? cards.map((c, i) => ({ ...c, progress: Math.max(10, Math.min(92, 18 + i * 11)) })) : cards;
  return (
    <section className="animate-fade-up space-y-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${labelClass}`}>{label}</span>
          <h2 className="text-lg font-bold text-[rgba(232,230,225,0.9)]">{title}</h2>
        </div>
        <span className="text-[11px] uppercase tracking-[0.2em] text-[rgba(232,230,225,0.25)]">Scroll →</span>
      </div>
      <div className="vault-divider" />
      <div className="scroll-row">
        {display.map((card, i) => (
          <VaultCard key={`${title}-${i}-${card.id}`} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { pockets } = useCollection();
  const summary = getCollectionSummary(pockets);
  const owned = pockets.filter((c) => c.owned).map(toShowcaseCard);
  const missing = pockets.filter((c) => !c.owned).map(toShowcaseCard);
  const wishlist = pockets.filter((c) => c.wishlist).map(toShowcaseCard);
  const all = pockets.map(toShowcaseCard);

  const featured = pockets.find((c) => c.owned) ?? pockets[0];
  const featuredCard = featured ? toShowcaseCard(featured) : null;

  const recentlyAdded = ensureLength([...owned].reverse(), all, 12);
  const continueBinder = ensureLength([...missing, ...wishlist], all, 12);
  const suggested = ensureLength(all.filter((_, i) => i % 2 === 0), all, 12);
  const wishlistRow = ensureLength(wishlist, all, 12);

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (summary.completion / 100) * circumference;

  return (
    <Layout>
      <div className="space-y-14">

        {/* ══ CINEMATIC HERO ══════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-3xl animate-fade-up" style={{ minHeight: 520 }}>
          {/* Deep vault background */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #080c10 0%, #0d1a0f 35%, #0a0d1a 65%, #0d0d0f 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(200,155,60,0.12), transparent)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 80% at 0% 100%, rgba(22,163,74,0.08), transparent)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 80% at 100% 0%, rgba(59,91,219,0.06), transparent)" }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative grid gap-10 p-8 lg:grid-cols-[1fr_320px] lg:items-center lg:p-14">
            {/* Left — copy */}
            <div className="space-y-7 animate-slide-up">
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#22c55e]">Your vault is live</span>
              </div>

              <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl" style={{ lineHeight: 1.05 }}>
                Every card.<br />
                <span className="text-gold">Every moment.</span><br />
                <span className="text-[rgba(232,230,225,0.5)]">Preserved.</span>
              </h1>

              <p className="max-w-lg text-[15px] leading-relaxed text-[rgba(232,230,225,0.45)]">
                Football legends. Disney magic. Your personal vault holds them all — beautifully organised, always growing.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm">
                  Browse Cards →
                </Link>
                <Link href="/binder" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-7 py-3.5 text-sm font-semibold text-[rgba(232,230,225,0.8)] backdrop-blur-sm transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white">
                  Open Binder
                </Link>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-3 pt-1">
                {[
                  { label: "Owned", value: summary.ownedCount, suffix: "", color: "text-[#4ade80]", border: "border-[rgba(34,197,94,0.2)]", bg: "bg-[rgba(34,197,94,0.06)]" },
                  { label: "Wishlist", value: summary.wishlistCount, suffix: "", color: "text-[#fb923c]", border: "border-[rgba(249,115,22,0.2)]", bg: "bg-[rgba(249,115,22,0.06)]" },
                  { label: "Missing", value: summary.missingCount, suffix: "", color: "text-[rgba(232,230,225,0.5)]", border: "border-[rgba(255,255,255,0.08)]", bg: "bg-[rgba(255,255,255,0.03)]" },
                  { label: "Complete", value: summary.completion, suffix: "%", color: "text-[#f5d97a]", border: "border-[rgba(200,155,60,0.25)]", bg: "bg-[rgba(200,155,60,0.06)]" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.border} ${s.bg}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(232,230,225,0.35)]">{s.label}</p>
                    <p className={`mt-0.5 text-2xl font-black ${s.color}`}>
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — featured card + ring */}
            <div className="flex flex-col items-center gap-6">
              {featuredCard && (
                <div className="animate-float-card relative">
                  <div className="card-foil relative overflow-hidden rounded-2xl" style={{ width: 220, boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(200,155,60,0.15)" }}>
                    <div className="relative" style={{ height: 340 }}>
                      {featuredCard.imageUrl ? (
                        <img src={featuredCard.imageUrl} alt={featuredCard.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl" style={{ background: "linear-gradient(135deg, #1c1c22, #2a2a32)" }}>🃏</div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)" }} />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-bold text-white">{featuredCard.title}</p>
                        <p className="mt-0.5 text-[11px] text-[rgba(232,230,225,0.5)]">{featuredCard.subtitle}</p>
                      </div>
                    </div>
                    <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#f5d97a] to-[#c89b3c] px-2.5 py-1 text-[10px] font-black text-[#0d0d0f]">★ Featured</span>
                  </div>
                </div>
              )}

              {/* Completion ring */}
              <div className="flex flex-col items-center gap-2">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle className="ring-track" cx="50" cy="50" r="44" />
                  <circle
                    className="ring-fill"
                    cx="50" cy="50" r="44"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                  <text x="50" y="46" textAnchor="middle" className="text-[18px] font-black fill-[#f5d97a]" style={{ fontSize: 18, fontWeight: 900, fill: "#f5d97a" }}>
                    {summary.completion}%
                  </text>
                  <text x="50" y="60" textAnchor="middle" style={{ fontSize: 9, fill: "rgba(232,230,225,0.35)", fontWeight: 600, letterSpacing: "0.1em" }}>
                    COMPLETE
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Category banners */}
          <div className="relative grid grid-cols-2 border-t border-[rgba(255,255,255,0.05)]">
            <Link href="/catalogue" className="group flex items-center gap-4 p-5 transition hover:bg-[rgba(22,163,74,0.06)]" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.2)" }}>⚽</div>
              <div>
                <p className="text-sm font-bold text-[rgba(232,230,225,0.9)]">Football Cards</p>
                <p className="text-[11px] text-[rgba(22,163,74,0.8)]">Premier League · La Liga · Champions League</p>
              </div>
              <span className="ml-auto text-[rgba(232,230,225,0.2)] transition group-hover:text-[rgba(232,230,225,0.6)]">→</span>
            </Link>
            <Link href="/catalogue" className="group flex items-center gap-4 p-5 transition hover:bg-[rgba(59,91,219,0.06)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: "rgba(59,91,219,0.12)", border: "1px solid rgba(59,91,219,0.2)" }}>✨</div>
              <div>
                <p className="text-sm font-bold text-[rgba(232,230,225,0.9)]">Disney Cards</p>
                <p className="text-[11px] text-[rgba(116,143,252,0.8)]">Classic · Pixar · Marvel · Star Wars</p>
              </div>
              <span className="ml-auto text-[rgba(232,230,225,0.2)] transition group-hover:text-[rgba(232,230,225,0.6)]">→</span>
            </Link>
          </div>
        </section>

        {/* ══ CARD ROWS ═══════════════════════════════════════════════════ */}
        <CardRow title="Recently Added" label="New Pulls" labelClass="badge-owned" cards={recentlyAdded} delay={80} />
        <CardRow title="Continue Your Binder" label="In Progress" labelClass="badge-wishlist" cards={continueBinder} showProgress delay={160} />
        <CardRow title="Because You Collected" label="Suggested" labelClass="badge-market" cards={suggested} delay={240} />
        <CardRow title="Wishlist Targets" label="Hunting" labelClass="badge-rare" cards={wishlistRow} delay={320} />

        {/* ══ QUICK ACTIONS ═══════════════════════════════════════════════ */}
        <section className="animate-fade-up grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: "400ms" }}>
          {[
            { href: "/catalogue", icon: "🔍", label: "Browse Catalogue", sub: "All Football & Disney cards", border: "rgba(200,155,60,0.15)", bg: "rgba(200,155,60,0.04)", hover: "rgba(200,155,60,0.08)" },
            { href: "/collection", icon: "📦", label: "My Collection", sub: "View & manage your vault", border: "rgba(34,197,94,0.15)", bg: "rgba(34,197,94,0.04)", hover: "rgba(34,197,94,0.08)" },
            { href: "/binder", icon: "📖", label: "Open Binder", sub: "Your premium card album", border: "rgba(59,91,219,0.15)", bg: "rgba(59,91,219,0.04)", hover: "rgba(59,91,219,0.08)" },
            { href: "/missing-cards", icon: "◎", label: "Complete Sets", sub: "Only a few cards left", border: "rgba(168,85,247,0.15)", bg: "rgba(168,85,247,0.04)", hover: "rgba(168,85,247,0.08)" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card-lift group flex items-center gap-4 rounded-2xl p-5 transition-all"
              style={{ background: item.bg, border: `1px solid ${item.border}` }}
            >
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="font-bold text-[rgba(232,230,225,0.9)]">{item.label}</p>
                <p className="mt-0.5 text-[12px] text-[rgba(232,230,225,0.4)]">{item.sub}</p>
              </div>
            </Link>
          ))}
        </section>

      </div>
    </Layout>
  );
}
