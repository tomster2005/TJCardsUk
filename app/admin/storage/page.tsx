"use client";

import { useEffect, useState } from "react";
import getBrowserSupabase from "@/lib/supabase/client";

type LocationRow = {
  location: string;
  totalCards: number;
  totalStock: number;
};

type UnlocatedCard = {
  id: string;
  player?: string;
  title?: string;
  card_number?: string;
  set_name?: string;
  stock?: number;
  image_url?: string;
};

export default function StoragePage() {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [unlocated, setUnlocated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnlocated, setShowUnlocated] = useState(false);
  const [unlocatedCards, setUnlocatedCards] = useState<UnlocatedCard[]>([]);
  const [unlocatedLoading, setUnlocatedLoading] = useState(false);

  async function fetchStorage() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const { data } = await supabase
      .from("cards")
      .select("storage_location, stock")
      .not("stock", "is", null);

    if (!data) return;

    const map = new Map<string, { totalCards: number; totalStock: number }>();
    let noLocation = 0;

    for (const card of data) {
      const stock = Number(card.stock ?? 0);
      if (!card.storage_location) {
        noLocation += stock;
        continue;
      }
      const existing = map.get(card.storage_location) ?? { totalCards: 0, totalStock: 0 };
      existing.totalCards += 1;
      existing.totalStock += stock;
      map.set(card.storage_location, existing);
    }

    const sorted = Array.from(map.entries())
      .map(([location, v]) => ({ location, ...v }))
      .sort((a, b) => a.location.localeCompare(b.location, undefined, { numeric: true }));

    setRows(sorted);
    setUnlocated(noLocation);
    setLoading(false);
  }

  async function fetchUnlocatedCards() {
    setUnlocatedLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const { data } = await supabase
      .from("cards")
      .select("id, player, title, card_number, set_name, stock, image_url")
      .or("storage_location.is.null,storage_location.eq.")
      .gt("stock", 0)
      .order("set_name", { ascending: true });

    setUnlocatedCards((data as UnlocatedCard[]) ?? []);
    setUnlocatedLoading(false);
  }

  function handleNoLocationClick() {
    setShowUnlocated(true);
    fetchUnlocatedCards();
  }

  useEffect(() => {
    fetchStorage();

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("storage-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, () => {
        fetchStorage();
        if (showUnlocated) fetchUnlocatedCards();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showUnlocated]);

  const totalStock = rows.reduce((s, r) => s + r.totalStock, 0) + unlocated;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Storage</h1>
            <p className="mt-2 text-sm text-zinc-600">Live card counts by storage location.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Live</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Locations</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Total Stock</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{totalStock}</p>
          </div>
          <button
            onClick={handleNoLocationClick}
            className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 text-center transition hover:border-amber-300 hover:bg-amber-100/60 cursor-pointer"
          >
            <p className="text-sm text-amber-700">No Location</p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">{unlocated}</p>
            <p className="mt-1 text-[11px] text-amber-600">Click to view →</p>
          </button>
        </div>
      </div>

      {/* Unlocated cards panel */}
      {showUnlocated && (
        <section className="rounded-3xl border border-amber-200/60 bg-amber-50/40 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Cards without a storage location</h2>
              <p className="text-sm text-zinc-500">These cards have stock but no location assigned.</p>
            </div>
            <button
              onClick={() => setShowUnlocated(false)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900"
            >
              Close
            </button>
          </div>

          {unlocatedLoading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : unlocatedCards.length === 0 ? (
            <p className="text-sm text-zinc-500">All cards with stock have a location assigned. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200/60 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-4">Image</th>
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Player</th>
                    <th className="pb-3 pr-4">Set</th>
                    <th className="pb-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {unlocatedCards.map((c) => (
                    <tr key={c.id} className="border-b border-amber-100 hover:bg-amber-50/60">
                      <td className="py-3 pr-4">
                        {c.image_url ? (
                          <img src={c.image_url} alt="" className="h-10 w-8 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-8 rounded bg-amber-100" />
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{c.card_number || "—"}</td>
                      <td className="py-3 pr-4 font-medium text-zinc-900">{c.player || c.title || "Untitled"}</td>
                      <td className="py-3 pr-4 text-zinc-600">{c.set_name || "—"}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {c.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Location table */}
      <section className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No storage locations assigned yet. Set a location on cards to see them here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-6">Location</th>
                  <th className="pb-3 pr-6">Card Types</th>
                  <th className="pb-3">Total Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.location} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 pr-6">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                        {row.location}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-zinc-600">{row.totalCards}</td>
                    <td className="py-3">
                      <span className="text-lg font-bold text-zinc-900">{row.totalStock}</span>
                      <span className="ml-1.5 text-xs text-zinc-400">cards</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
