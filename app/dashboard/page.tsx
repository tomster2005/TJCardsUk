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
    isRare: false,
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
  return (
    <article
      className={`card-foil group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] ${card.isRare ? "card-rare" : ""}`}
      style={{ width: 156, boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className="relative overflow-hidden" style={{ height: 210 }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f5f1ea] to-[#ede8df]">
            <span className="text-3xl opacity-20">🃏</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <span className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${card.badgeType === "owned" ? "bg-emerald-500/90 text-white" : card.badgeType === "wishlist" ? "bg-orange-500/90 text-white" : "bg-white/80 text-zinc-500"}`}>
          {card.badge}
        </span>
        {card.isRare && (
          <span className="absolute right-2 top-2 rounded-md bg-purple-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white">✦</span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="truncate text-[11px] font-semibold text-white leading-tight">{card.title}</p>
          <p className="truncate text-[9px] text-white/50 mt-0.5">{card.subtitle}</p>
        </div>
      </div>
      {card.progress !== undefined && (
        <div className="h-[2px] bg-black/5">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all" style={{ width: `${card.progress}%` }} />
        </div>
      )}
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
    <section className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-bold text-zinc-800">{title}</h2>
          <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${labelClass}`}>{label}</span>
        </div>
      </div>
      <div className="scroll-row gap-3">
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

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <section className="animate-fade-up relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(145deg, #fffdf8 0%, #fdf8f0 40%, #faf5ed 100%)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(200,155,60,0.08)" }}>
          {/* Warm ambient glow */}
          <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.15), transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-60 w-60 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(22,163,74,0.1), transparent 70%)" }} />

          <div className="relative grid items-center gap-10 p-8 lg:grid-cols-[1fr_280px] lg:p-12">

            {/* Left */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Vault active</span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl font-display" style={{ lineHeight: 1.1 }}>
                Every card.<br />
                <span className="text-gold">Every moment.</span><br />
                <span className="text-zinc-300">Preserved.</span>
              </h1>

              <p className="max-w-md text-[14px] leading-relaxed text-zinc-500">
                Football legends. Disney magic. Your personal vault holds them all — beautifully organised, always growing.
              </p>

              {/* Stats with coloured left accents */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                {[
                  { label: "Owned", value: summary.ownedCount, accent: "#16a34a", color: "text-emerald-700" },
                  { label: "Wishlist", value: summary.wishlistCount, accent: "#ea580c", color: "text-orange-600" },
                  { label: "Missing", value: summary.missingCount, accent: "#a1a1aa", color: "text-zinc-600" },
                  { label: "Complete", value: summary.completion, suffix: "%", accent: "#c89b3c", color: "text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className="relative pl-3">
                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: s.accent, opacity: 0.6 }} />
                    <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">{s.label}</p>
                    <p className={`mt-0.5 text-xl font-black tabular-nums ${s.color}`}>
                      <AnimatedCounter value={s.value} suffix={s.suffix || ""} />
                    </p>
                  </div>
                ))}
              </div>

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

            {/* Right — featured card */}
            <div className="flex flex-col items-center gap-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
              {featuredCard && (
                <div className="relative">
                  {/* Glow behind card */}
                  <div className="absolute -inset-6 rounded-3xl" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(200,155,60,0.12), transparent 70%)" }} />

                  <div
                    className="card-foil relative overflow-hidden rounded-2xl"
                    style={{
                      width: 220,
                      boxShadow: "0 24px 60px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.05), 0 0 0 1px rgba(200,155,60,0.1)",
                      animation: "float-slow 5s ease-in-out infinite",
                    }}
                  >
                    <div className="relative" style={{ height: 310 }}>
                      {featuredCard.imageUrl ? (
                        <img src={featuredCard.imageUrl} alt={featuredCard.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f5f1ea] to-[#ede8df] text-5xl">🃏</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[13px] font-bold text-white">{featuredCard.title}</p>
                        <p className="mt-0.5 text-[10px] text-white/60">{featuredCard.subtitle}</p>
                      </div>
                    </div>
                    <span className="absolute left-3 top-3 rounded-md bg-gradient-to-r from-amber-300 to-amber-500 px-2 py-0.5 text-[9px] font-black text-amber-900 shadow-sm">★ Featured</span>
                  </div>
                </div>
              )}

              {/* Completion ring */}
              <svg width="68" height="68" viewBox="0 0 100 100">
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
                  {summary.completion}%
                </text>
                <text x="50" y="63" textAnchor="middle" style={{ fontSize: 7, fill: "#a8a29e", fontWeight: 600, letterSpacing: "0.12em" }}>
                  COMPLETE
                </text>
              </svg>
            </div>
          </div>

          {/* Bottom strip — categories */}
          <div className="flex border-t border-[rgba(0,0,0,0.05)]">
            <Link href="/catalogue" className="group flex flex-1 items-center gap-3 px-8 py-4 transition hover:bg-white/50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm shadow-sm">⚽</span>
              <div>
                <p className="text-[12px] font-semibold text-zinc-700 group-hover:text-zinc-900">Football Cards</p>
                <p className="text-[10px] text-zinc-400">Premier League · La Liga · UCL</p>
              </div>
            </Link>
            <div className="w-px bg-[rgba(0,0,0,0.05)]" />
            <Link href="/catalogue" className="group flex flex-1 items-center gap-3 px-8 py-4 transition hover:bg-white/50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm shadow-sm">✨</span>
              <div>
                <p className="text-[12px] font-semibold text-zinc-700 group-hover:text-zinc-900">Disney Cards</p>
                <p className="text-[10px] text-zinc-400">Classic · Pixar · Marvel · Star Wars</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ══ CARD ROWS ═══════════════════════════════════════════════════ */}
        <CardRow title="Recently Added" label="New" labelClass="badge-owned" cards={recentlyAdded} delay={80} />
        <CardRow title="Continue Your Binder" label="In Progress" labelClass="badge-wishlist" cards={continueBinder} showProgress delay={160} />
        <CardRow title="Because You Collected" label="Suggested" labelClass="badge-market" cards={suggested} delay={240} />
        <CardRow title="Wishlist Targets" label="Hunting" labelClass="badge-rare" cards={wishlistRow} delay={320} />

        {/* ══ QUICK ACTIONS ═══════════════════════════════════════════════ */}
        <section className="animate-fade-up" style={{ animationDelay: "400ms" }}>
          <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/catalogue", icon: "🔍", label: "Browse Catalogue", sub: "All Football & Disney cards", tint: "rgba(200,155,60,0.06)", hover: "rgba(200,155,60,0.1)" },
              { href: "/collection", icon: "📦", label: "My Collection", sub: "View & manage your vault", tint: "rgba(22,163,74,0.05)", hover: "rgba(22,163,74,0.09)" },
              { href: "/binder", icon: "📖", label: "Open Binder", sub: "Your premium card album", tint: "rgba(59,91,219,0.05)", hover: "rgba(59,91,219,0.09)" },
              { href: "/missing-cards", icon: "◎", label: "Complete Sets", sub: "Only a few cards left", tint: "rgba(147,51,234,0.05)", hover: "rgba(147,51,234,0.09)" },
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
