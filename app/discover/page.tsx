"use client";

import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import getBrowserSupabase from "@/lib/supabase/client";
import Link from "next/link";

type SetInfo = {
  name: string;
  cardCount: number;
  inStock: number;
  hasBinder: boolean;
};

export default function DiscoverPage() {
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      // Get all published cards grouped by set
      const { data: cards } = await supabase
        .from("cards")
        .select("set_name, stock, status")
        .eq("status", "published");

      // Get binder sets for matching
      const { data: binderSets } = await supabase
        .from("binder_sets")
        .select("title");

      const binderTitles = new Set((binderSets || []).map((b) => b.title));

      // Group by set
      const setMap = new Map<string, { count: number; inStock: number }>();
      if (cards) {
        for (const c of cards) {
          const name = c.set_name || "Unknown";
          const existing = setMap.get(name) || { count: 0, inStock: 0 };
          existing.count++;
          if ((c.stock || 0) > 0) existing.inStock++;
          setMap.set(name, existing);
        }
      }

      const result: SetInfo[] = Array.from(setMap.entries())
        .map(([name, data]) => ({
          name,
          cardCount: data.count,
          inStock: data.inStock,
          hasBinder: binderTitles.has(name),
        }))
        .sort((a, b) => b.cardCount - a.cardCount);

      setSets(result);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Layout>
      <div className="space-y-8 animate-fade-up">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 240, background: "linear-gradient(135deg, #fef9ec 0%, #f8f6f2 100%)", border: "1px solid rgba(200,155,60,0.15)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 30% -20%, rgba(200,155,60,0.1), transparent)" }} />
          <div className="relative p-8 sm:p-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">Discover</span>
            <h1 className="mt-2 text-3xl font-black text-zinc-900 font-display sm:text-4xl">
              Explore our sets
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              {loading ? "Loading..." : `${sets.length} set${sets.length !== 1 ? "s" : ""} available.`}
            </p>
          </div>
        </section>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && sets.length === 0 && (
          <div className="rounded-3xl p-16 text-center bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            <p className="text-lg font-bold text-zinc-700">No sets yet</p>
            <p className="mt-2 text-sm text-zinc-500">Cards will appear here once published.</p>
          </div>
        )}

        {!loading && sets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
              <article key={set.name} className="card-lift overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--gold-400), var(--gold-300), var(--gold-400))" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-zinc-900">{set.name}</h3>
                      <p className="mt-0.5 text-[12px] text-zinc-500">{set.cardCount} cards listed</p>
                    </div>
                    {set.hasBinder && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                        Binder
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">In Stock</p>
                        <p className="text-lg font-black text-zinc-900">{set.inStock}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Total</p>
                        <p className="text-lg font-black text-zinc-900">{set.cardCount}</p>
                      </div>
                    </div>
                    <Link
                      href={`/catalogue?set=${encodeURIComponent(set.name)}`}
                      className="rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--gold-600)] transition hover:bg-[rgba(200,155,60,0.08)]"
                      style={{ border: "1px solid rgba(200,155,60,0.25)" }}
                    >
                      View cards
                    </Link>
                  </div>

                  {set.hasBinder && (
                    <Link
                      href="/binder"
                      className="mt-3 block w-full rounded-xl py-2 text-center text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-50"
                      style={{ border: "1px solid rgba(22,163,74,0.2)" }}
                    >
                      Open binder
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
