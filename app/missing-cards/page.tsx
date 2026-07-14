"use client";

import { Layout } from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import getBrowserSupabase from "@/lib/supabase/client";

type MissingCard = {
  id: string;
  card_number: string;
  player_name: string;
  team: string | null;
  parallel: string | null;
  set_title: string;
};

export default function MissingCardsPage() {
  const [missing, setMissing] = useState<MissingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSet, setFilterSet] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      // Get all binder sets
      const { data: sets } = await supabase.from("binder_sets").select("id, title");
      if (!sets || sets.length === 0) { setLoading(false); return; }

      // Get all checklist entries
      const { data: checklist } = await supabase
        .from("binder_checklist")
        .select("id, card_number, player_name, team, parallel, set_id");
      if (!checklist) { setLoading(false); return; }

      // Get all cards we own (by set_name + card_number)
      const { data: cards } = await supabase
        .from("cards")
        .select("card_number, set_name");

      // Build lookup of owned cards: "setName|cardNumber"
      const ownedSet = new Set<string>();
      if (cards) {
        for (const c of cards) {
          ownedSet.add(`${c.set_name}|${c.card_number}`);
        }
      }

      // Build set title lookup
      const setMap = new Map<string, string>();
      for (const s of sets) setMap.set(s.id, s.title);

      // Find missing
      const missingCards: MissingCard[] = [];
      for (const item of checklist) {
        const setTitle = setMap.get(item.set_id) || "Unknown";
        const key = `${setTitle}|${item.card_number}`;
        if (!ownedSet.has(key)) {
          missingCards.push({
            id: item.id,
            card_number: item.card_number,
            player_name: item.player_name,
            team: item.team,
            parallel: item.parallel,
            set_title: setTitle,
          });
        }
      }

      setMissing(missingCards);
      setLoading(false);
    }
    load();
  }, []);

  const sets = useMemo(() => Array.from(new Set(missing.map((m) => m.set_title))).sort(), [missing]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return missing.filter((m) => {
      if (filterSet !== "all" && m.set_title !== filterSet) return false;
      if (q && !m.player_name.toLowerCase().includes(q) && !m.card_number.includes(q) && !(m.team || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [missing, filterSet, search]);

  const totalInBinders = missing.length + (missing.length > 0 ? 0 : 0); // placeholder for owned count
  const completion = missing.length === 0 ? 100 : 0; // will calculate properly below

  return (
    <Layout>
      <div className="space-y-8 animate-fade-up">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 200, background: "linear-gradient(135deg, #fef9ec 0%, #f8f6f2 100%)", border: "1px solid rgba(200,155,60,0.15)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 20% -10%, rgba(200,155,60,0.1), transparent)" }} />
          <div className="relative p-8 sm:p-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">Missing Cards</span>
            <h1 className="mt-2 text-3xl font-black text-zinc-900 font-display sm:text-4xl">
              {loading ? "Loading..." : missing.length === 0 ? "All binders complete!" : `${missing.length} cards still needed`}
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              {loading ? "" : missing.length === 0 ? "You have every card in your binder checklists." : "Cards from your binder checklists that aren't in your inventory yet."}
            </p>
          </div>
        </section>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && missing.length === 0 && (
          <div className="rounded-3xl p-16 text-center bg-white" style={{ border: "1px solid rgba(22,163,74,0.2)" }}>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>🏆</div>
            <h2 className="text-xl font-black text-zinc-800">All binders complete!</h2>
            <p className="mt-2 text-[13px] text-zinc-500">Every card in your binder checklists is in your inventory.</p>
          </div>
        )}

        {!loading && missing.length > 0 && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player, card #, team..."
                className="flex-1 min-w-[200px] rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]"
              />
              <select value={filterSet} onChange={(e) => setFilterSet(e.target.value)} className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-sm">
                <option value="all">All sets ({missing.length})</option>
                {sets.map((s) => (
                  <option key={s} value={s}>{s} ({missing.filter((m) => m.set_title === s).length})</option>
                ))}
              </select>
            </div>

            {/* Count */}
            <p className="text-sm text-zinc-500">{filtered.length} missing card{filtered.length !== 1 ? "s" : ""} shown</p>

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((card) => (
                <article key={card.id} className="rounded-2xl bg-white p-4" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{card.player_name}</p>
                      <p className="text-[11px] text-zinc-500">#{card.card_number}{card.team ? ` \u00b7 ${card.team}` : ""}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 border border-red-200">
                      Missing
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">{card.set_title}</span>
                    {card.parallel && card.parallel !== "Base" && (
                      <span className="rounded-full bg-[#fafaf9] px-2 py-0.5 text-[9px] text-zinc-500" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>{card.parallel}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
