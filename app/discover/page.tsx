"use client";

import { Layout } from "@/components/Layout";
import { useCollection } from "@/contexts/CollectionContext";
import { getCollectionSummary } from "@/lib/collection/utils";
import { discoverSets } from "@/lib/demo-data/sets";
import Link from "next/link";

export default function DiscoverPage() {
  const { pockets } = useCollection();
  const summary = getCollectionSummary(pockets);

  return (
    <Layout>
      <div className="space-y-12 animate-fade-up">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 360 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #06091a 0%, #0d1535 40%, #080c10 70%, #0d0d0f 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 30% -20%, rgba(200,155,60,0.15), transparent)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 100% 100%, rgba(204,93,232,0.08), transparent)" }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          <div className="relative p-8 sm:p-14">
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[rgba(116,143,252,0.8)]">Discover</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Find your next<br />
                <span className="text-gold">obsession.</span>
              </h1>
              <p className="text-[14px] leading-relaxed text-[rgba(232,230,225,0.4)]">
                Explore Football and Disney collections. Discover sets you can complete. Find the cards you're missing.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">Browse all cards →</Link>
                <Link href="/missing-cards" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-semibold text-[rgba(232,230,225,0.7)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white">Complete sets</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Football Section ──────────────────────────────────────────── */}
        <section className="space-y-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.2)" }}>⚽</div>
            <div>
              <span className="badge-football rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">Football</span>
              <h2 className="mt-1 text-xl font-black text-[rgba(232,230,225,0.9)]">Football Collections</h2>
            </div>
          </div>
          <div className="vault-divider" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-grid">
            {discoverSets.slice(0, 3).map((set) => {
              const completion = Math.round((summary.ownedCount / Math.max(1, summary.totalCards)) * 100);
              return (
                <article key={set.id} className="card-lift relative overflow-hidden rounded-2xl" style={{ background: "var(--vault-raised)", border: "1px solid rgba(22,163,74,0.12)" }}>
                  <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #16a34a, #22c55e, #16a34a)" }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(34,197,94,0.7)]">{set.brand}</p>
                        <h3 className="mt-1 text-base font-black text-[rgba(232,230,225,0.9)]">{set.title}</h3>
                        <p className="mt-0.5 text-[12px] text-[rgba(232,230,225,0.4)]">{set.year} · {set.totalCards} cards</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[9px] text-[rgba(232,230,225,0.35)]">Owned</p>
                        <p className="text-lg font-black text-[rgba(232,230,225,0.9)]">{set.ownedCount}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[10px]">
                        <span className="text-[rgba(232,230,225,0.35)]">Completion</span>
                        <span className="font-black text-[#4ade80]">{completion}%</span>
                      </div>
                      <div className="progress-track h-2">
                        <div className="progress-fill-football h-full" style={{ width: `${completion}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${completion === 100 ? "badge-owned" : completion > 50 ? "badge-football" : "badge-market"}`}>
                        {completion === 100 ? "✓ Complete" : completion > 50 ? "In progress" : "Just started"}
                      </span>
                      <Link href="/catalogue" className="text-[12px] font-bold text-[rgba(34,197,94,0.7)] transition hover:text-[#4ade80]">View set →</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Disney Section ────────────────────────────────────────────── */}
        <section className="space-y-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: "rgba(59,91,219,0.12)", border: "1px solid rgba(59,91,219,0.2)" }}>✨</div>
            <div>
              <span className="badge-disney rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">Disney</span>
              <h2 className="mt-1 text-xl font-black text-[rgba(232,230,225,0.9)]">Disney Collections</h2>
            </div>
          </div>
          <div className="vault-divider" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-grid">
            {discoverSets.slice(3, 6).map((set) => {
              const completion = Math.round((summary.ownedCount / Math.max(1, summary.totalCards)) * 100);
              return (
                <article key={set.id} className="card-lift relative overflow-hidden rounded-2xl" style={{ background: "var(--vault-raised)", border: "1px solid rgba(59,91,219,0.12)" }}>
                  <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #3b5bdb, #748ffc, #cc5de8, #748ffc, #3b5bdb)" }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(116,143,252,0.7)]">{set.brand}</p>
                        <h3 className="mt-1 text-base font-black text-[rgba(232,230,225,0.9)]">{set.title}</h3>
                        <p className="mt-0.5 text-[12px] text-[rgba(232,230,225,0.4)]">{set.year} · {set.totalCards} cards</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[9px] text-[rgba(232,230,225,0.35)]">Owned</p>
                        <p className="text-lg font-black text-[rgba(232,230,225,0.9)]">{set.ownedCount}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[10px]">
                        <span className="text-[rgba(232,230,225,0.35)]">Completion</span>
                        <span className="font-black text-[#748ffc]">{completion}%</span>
                      </div>
                      <div className="progress-track h-2">
                        <div className="progress-fill-disney h-full" style={{ width: `${completion}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${completion === 100 ? "badge-owned" : "badge-disney"}`}>
                        {completion === 100 ? "✓ Complete" : "In progress"}
                      </span>
                      <Link href="/catalogue" className="text-[12px] font-bold text-[rgba(116,143,252,0.7)] transition hover:text-[#748ffc]">View set →</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Progress CTA ──────────────────────────────────────────────── */}
        <section className="animate-fade-up overflow-hidden rounded-3xl" style={{ animationDelay: "180ms", background: "linear-gradient(135deg, rgba(200,155,60,0.08), rgba(200,155,60,0.04))", border: "1px solid rgba(200,155,60,0.15)" }}>
          <div className="flex flex-wrap items-center justify-between gap-6 p-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(200,155,60,0.7)]">Your Progress</p>
              <h2 className="text-2xl font-black text-[rgba(232,230,225,0.9)]">{summary.completion}% of your collection complete</h2>
              <p className="text-[13px] text-[rgba(232,230,225,0.4)]">{summary.ownedCount} owned · {summary.missingCount} missing · {summary.wishlistCount} on wishlist</p>
            </div>
            <div className="flex gap-3">
              <Link href="/missing-cards" className="rounded-full border border-[rgba(200,155,60,0.3)] bg-[rgba(200,155,60,0.08)] px-5 py-2.5 text-sm font-bold text-[#f5d97a] transition hover:bg-[rgba(200,155,60,0.14)]">Complete sets →</Link>
              <Link href="/collection" className="btn-gold rounded-full px-5 py-2.5 text-sm">View vault</Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
