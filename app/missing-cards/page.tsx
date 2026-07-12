"use client";

import { Layout } from "@/components/Layout";
import { useCollection } from "@/contexts/CollectionContext";
import { getMissingItems, getCollectionSummary } from "@/lib/collection/utils";
import Link from "next/link";

export default function MissingCardsPage() {
  const { pockets, toggleWishlist } = useCollection();
  const missingCards = getMissingItems(pockets);
  const summary = getCollectionSummary(pockets);
  const remaining = missingCards.length;
  const completion = summary.completion;

  const urgency = remaining === 0 ? "complete" : remaining <= 3 ? "critical" : remaining <= 10 ? "close" : "progress";
  const urgencyBorder = {
    complete: "rgba(22,163,74,0.2)",
    critical: "rgba(220,38,38,0.2)",
    close:    "rgba(200,155,60,0.2)",
    progress: "rgba(37,99,235,0.15)",
  }[urgency];
  const urgencyBg = {
    complete: "linear-gradient(135deg, #f0fdf4 0%, #fef9ec 40%, #f8f6f2 100%)",
    critical: "linear-gradient(135deg, #fff5f5 0%, #fef9ec 40%, #f8f6f2 100%)",
    close:    "linear-gradient(135deg, #fef9ec 0%, #fffbeb 40%, #f8f6f2 100%)",
    progress: "linear-gradient(135deg, #eff6ff 0%, #fef9ec 40%, #f8f6f2 100%)",
  }[urgency];
  const urgencyGlow = {
    complete: "rgba(22,163,74,0.1)",
    critical: "rgba(220,38,38,0.1)",
    close:    "rgba(200,155,60,0.12)",
    progress: "rgba(37,99,235,0.08)",
  }[urgency];
  const urgencyLabel = { complete: "Collection Complete!", critical: "Almost there!", close: "So close!", progress: "Keep collecting" }[urgency];
  const urgencyColor = { complete: "#15803d", critical: "#b91c1c", close: "#92400e", progress: "#1d4ed8" }[urgency];

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (completion / 100) * circumference;

  return (
    <Layout>
      <div className="space-y-10 animate-fade-up">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 320, background: urgencyBg, border: `1px solid ${urgencyBorder}` }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 20% -10%, ${urgencyGlow}, transparent)` }} />

          <div className="relative p-8 sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: urgencyColor }}>{urgencyLabel}</span>
                </div>
                <h1 className="text-3xl font-black text-zinc-900 sm:text-4xl">
                  {remaining === 0
                    ? "Your collection is complete! 🏆"
                    : <>Only <span style={{ color: urgencyColor }}>{remaining} cards</span> left to collect</>
                  }
                </h1>
                <p className="text-[14px] text-zinc-500">
                  {completion}% complete · {summary.ownedCount} owned · {remaining} missing
                </p>

                <div className="max-w-md">
                  <div className="progress-track h-3">
                    <div
                      className="h-full rounded-full animate-progress-grow"
                      style={{ width: `${completion}%`, background: `linear-gradient(90deg, ${urgencyColor}, ${urgencyColor}99)`, boxShadow: `0 0 8px ${urgencyColor}44` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="10" />
                  <circle
                    cx="65" cy="65" r="52"
                    fill="none"
                    stroke={urgencyColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 65 65)"
                    style={{ filter: `drop-shadow(0 0 6px ${urgencyColor}66)`, transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
                  />
                  <text x="65" y="60" textAnchor="middle" style={{ fontSize: 22, fontWeight: 900, fill: urgencyColor }}>{completion}%</text>
                  <text x="65" y="78" textAnchor="middle" style={{ fontSize: 10, fill: "rgba(0,0,0,0.35)", fontWeight: 700, letterSpacing: "0.1em" }}>COMPLETE</text>
                </svg>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">Find missing cards →</Link>
              <Link href="/wishlist" className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900">View wishlist</Link>
            </div>
          </div>
        </section>

        {/* ── Complete ──────────────────────────────────────────────────── */}
        {remaining === 0 && (
          <div className="rounded-3xl p-16 text-center bg-white" style={{ border: "1px solid rgba(22,163,74,0.2)" }}>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>🏆</div>
            <h2 className="text-2xl font-black text-zinc-800">Collection Complete!</h2>
            <p className="mt-2 text-[14px] text-zinc-500">You&apos;ve collected every card. Time to start a new set.</p>
            <Link href="/discover" className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 20px rgba(22,163,74,0.3)" }}>
              Discover new sets →
            </Link>
          </div>
        )}

        {/* ── Missing grid ──────────────────────────────────────────────── */}
        {remaining > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-800">Cards you still need</h2>
                <p className="mt-0.5 text-[13px] text-zinc-400">Add to wishlist or find them in the catalogue</p>
              </div>
              <span className="rounded-full px-3 py-1.5 text-[12px] font-bold text-zinc-500 bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                {remaining} remaining
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-grid">
              {missingCards.map((card, index) => {
                const priority = index < 3 ? "high" : index < 8 ? "medium" : "low";
                const priorityColor = priority === "high" ? "#b91c1c" : priority === "medium" ? "#92400e" : "rgba(0,0,0,0.15)";
                return (
                  <article key={card.id} className="card-lift relative overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="h-1 w-full" style={{ background: priorityColor }} />
                    <div className="relative flex h-44 flex-col items-center justify-center bg-[#fafaf9]">
                      <span className="text-5xl opacity-10">◎</span>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Missing</p>
                      <div className="absolute left-3 top-3 flex items-center gap-1.5">
                        {priority === "high" && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[8px] font-black text-white">Priority</span>}
                        <span className="rounded-full px-2 py-0.5 text-[8px] font-black text-zinc-400 bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>#{index + 1}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-black text-zinc-800">#{card.cardNumber} {card.playerName}</p>
                      <p className="mt-0.5 text-[12px] text-zinc-500">{card.teamName}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">{card.parallelName}</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(card.id)}
                          className="flex-1 rounded-full py-2 text-[11px] font-bold transition"
                          style={{
                            background: card.wishlist ? "rgba(234,88,12,0.08)" : "#fafaf9",
                            border: `1px solid ${card.wishlist ? "rgba(234,88,12,0.25)" : "rgba(0,0,0,0.08)"}`,
                            color: card.wishlist ? "#c2410c" : "#a1a1aa",
                          }}
                        >
                          {card.wishlist ? "♡ Wishlisted" : "♡ Wishlist"}
                        </button>
                        <Link href="/catalogue" className="flex-1 rounded-full py-2 text-center text-[11px] font-bold text-[#92400e] transition hover:bg-[rgba(200,155,60,0.1)]" style={{ background: "rgba(200,155,60,0.06)", border: "1px solid rgba(200,155,60,0.2)" }}>
                          Find it →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="rounded-3xl p-8 bg-white" style={{ border: "1px solid rgba(200,155,60,0.2)" }}>
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#92400e]">Fastest route to completion</p>
                  <h3 className="mt-2 text-xl font-black text-zinc-800">
                    {remaining <= 5 ? `Just ${remaining} more cards and you're done!` : `${remaining} cards stand between you and a complete set`}
                  </h3>
                </div>
                <Link href="/catalogue" className="btn-gold rounded-full px-6 py-3 text-sm">Complete your set →</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
