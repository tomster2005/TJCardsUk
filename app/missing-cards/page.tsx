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
  const urgencyBg = {
    complete:  "linear-gradient(135deg, #060e08 0%, #0a1a0f 40%, #0d0d0f 100%)",
    critical:  "linear-gradient(135deg, #120400 0%, #1f0800 40%, #0d0d0f 100%)",
    close:     "linear-gradient(135deg, #0a0800 0%, #1a1400 40%, #0d0d0f 100%)",
    progress:  "linear-gradient(135deg, #080c10 0%, #0d1a0f 40%, #0d0d0f 100%)",
  }[urgency];
  const urgencyGlow = {
    complete: "rgba(34,197,94,0.15)",
    critical: "rgba(239,68,68,0.15)",
    close:    "rgba(200,155,60,0.15)",
    progress: "rgba(59,130,246,0.1)",
  }[urgency];
  const urgencyLabel = { complete: "Collection Complete!", critical: "Almost there!", close: "So close!", progress: "Keep collecting" }[urgency];
  const urgencyColor = { complete: "#4ade80", critical: "#f87171", close: "#f5d97a", progress: "#60a5fa" }[urgency];

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (completion / 100) * circumference;

  return (
    <Layout>
      <div className="space-y-10 animate-fade-up">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 320, background: urgencyBg }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 20% -10%, ${urgencyGlow}, transparent)` }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          <div className="relative p-8 sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: urgencyColor }}>{urgencyLabel}</span>
                </div>
                <h1 className="text-3xl font-black text-white sm:text-4xl">
                  {remaining === 0
                    ? "Your collection is complete! 🏆"
                    : <>Only <span style={{ color: urgencyColor }}>{remaining} cards</span> left to collect</>
                  }
                </h1>
                <p className="text-[14px] text-[rgba(232,230,225,0.4)]">
                  {completion}% complete · {summary.ownedCount} owned · {remaining} missing
                </p>

                {/* Progress bar */}
                <div className="max-w-md">
                  <div className="progress-track h-3">
                    <div
                      className="h-full rounded-full animate-progress-grow"
                      style={{ width: `${completion}%`, background: `linear-gradient(90deg, ${urgencyColor}, ${urgencyColor}aa)`, boxShadow: `0 0 12px ${urgencyColor}66` }}
                    />
                  </div>
                </div>
              </div>

              {/* Big completion ring */}
              <div className="flex flex-col items-center gap-2">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="65" cy="65" r="52"
                    fill="none"
                    stroke={urgencyColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 65 65)"
                    style={{ filter: `drop-shadow(0 0 8px ${urgencyColor}88)`, transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
                  />
                  <text x="65" y="60" textAnchor="middle" style={{ fontSize: 22, fontWeight: 900, fill: urgencyColor }}>{completion}%</text>
                  <text x="65" y="78" textAnchor="middle" style={{ fontSize: 10, fill: "rgba(232,230,225,0.35)", fontWeight: 700, letterSpacing: "0.1em" }}>COMPLETE</text>
                </svg>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">Find missing cards →</Link>
              <Link href="/wishlist" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-2.5 text-sm font-semibold text-[rgba(232,230,225,0.6)] transition hover:text-[rgba(232,230,225,0.9)]">View wishlist</Link>
            </div>
          </div>
        </section>

        {/* ── Complete ──────────────────────────────────────────────────── */}
        {remaining === 0 && (
          <div className="rounded-3xl p-16 text-center" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 8px 32px rgba(34,197,94,0.2)" }}>🏆</div>
            <h2 className="text-2xl font-black text-[rgba(232,230,225,0.9)]">Collection Complete!</h2>
            <p className="mt-2 text-[14px] text-[rgba(232,230,225,0.4)]">You've collected every card. Time to start a new set.</p>
            <Link href="/discover" className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-black text-[#0d0d0f] transition hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}>
              Discover new sets →
            </Link>
          </div>
        )}

        {/* ── Missing grid ──────────────────────────────────────────────── */}
        {remaining > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[rgba(232,230,225,0.9)]">Cards you still need</h2>
                <p className="mt-0.5 text-[13px] text-[rgba(232,230,225,0.35)]">Add to wishlist or find them in the catalogue</p>
              </div>
              <span className="rounded-full px-3 py-1.5 text-[12px] font-bold text-[rgba(232,230,225,0.5)]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {remaining} remaining
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-grid">
              {missingCards.map((card, index) => {
                const priority = index < 3 ? "high" : index < 8 ? "medium" : "low";
                const priorityColor = priority === "high" ? "#f87171" : priority === "medium" ? "#f5d97a" : "rgba(255,255,255,0.1)";
                return (
                  <article key={card.id} className="card-lift relative overflow-hidden rounded-2xl" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
                    <div className="h-1 w-full" style={{ background: priorityColor }} />
                    <div className="relative flex h-44 flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #141418, #1c1c22)" }}>
                      <span className="text-5xl opacity-8">◎</span>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(232,230,225,0.2)]">Missing</p>
                      <div className="absolute left-3 top-3 flex items-center gap-1.5">
                        {priority === "high" && <span className="rounded-full bg-[rgba(239,68,68,0.8)] px-2 py-0.5 text-[8px] font-black text-white">Priority</span>}
                        <span className="rounded-full px-2 py-0.5 text-[8px] font-black text-[rgba(232,230,225,0.4)]" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>#{index + 1}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-black text-[rgba(232,230,225,0.9)]">#{card.cardNumber} {card.playerName}</p>
                      <p className="mt-0.5 text-[12px] text-[rgba(232,230,225,0.4)]">{card.teamName}</p>
                      <p className="mt-0.5 text-[11px] text-[rgba(232,230,225,0.3)]">{card.parallelName}</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(card.id)}
                          className="flex-1 rounded-full py-2 text-[11px] font-bold transition"
                          style={{
                            background: card.wishlist ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${card.wishlist ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.06)"}`,
                            color: card.wishlist ? "#fb923c" : "rgba(232,230,225,0.4)",
                          }}
                        >
                          {card.wishlist ? "♡ Wishlisted" : "♡ Wishlist"}
                        </button>
                        <Link href="/catalogue" className="flex-1 rounded-full py-2 text-center text-[11px] font-bold text-[rgba(200,155,60,0.8)] transition hover:text-[#f5d97a]" style={{ background: "rgba(200,155,60,0.06)", border: "1px solid rgba(200,155,60,0.15)" }}>
                          Find it →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="rounded-3xl p-8" style={{ background: "rgba(200,155,60,0.04)", border: "1px solid rgba(200,155,60,0.12)" }}>
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(200,155,60,0.6)]">Fastest route to completion</p>
                  <h3 className="mt-2 text-xl font-black text-[rgba(232,230,225,0.9)]">
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
