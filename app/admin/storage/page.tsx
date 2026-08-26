"use client";

import { useEffect, useState } from "react";
import getBrowserSupabase from "@/lib/supabase/client";

type LocationRow = { location: string; totalCards: number; totalStock: number };
type SuffixGroup = { suffix: string; setName: string; rows: LocationRow[]; totalStock: number };
type UnlocatedCard = { id: string; player?: string; title?: string; card_number?: string; set_name?: string; stock?: number; image_url?: string };
type BagCard = { copy_id: string; card_id: string; owner: string | null; title: string; card_number: string; set_name: string; image_url: string | null; parallel: string | null; };
type MoveState = { copy_id: string; newLocation: string };

function parseSuffix(location: string): string {
  const m = location.match(/^\d+([A-Z]+)$/i);
  return m ? m[1].toUpperCase() : "OTHER";
}

export default function StoragePage() {
  const [groups, setGroups] = useState<SuffixGroup[]>([]);
  const [unlocated, setUnlocated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnlocated, setShowUnlocated] = useState(false);
  const [unlocatedCards, setUnlocatedCards] = useState<UnlocatedCard[]>([]);
  const [unlocatedLoading, setUnlocatedLoading] = useState(false);
  const [selectedBag, setSelectedBag] = useState<string | null>(null);
  const [bagCards, setBagCards] = useState<BagCard[]>([]);
  const [bagLoading, setBagLoading] = useState(false);
  const [moves, setMoves] = useState<MoveState[]>([]);
  const [saving, setSaving] = useState(false);
  const [sealedBags, setSealedBags] = useState<Set<string>>(new Set());

  async function fetchSealed() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase.from("full_bags").select("location");
    setSealedBags(new Set((data ?? []).map((r: any) => r.location)));
  }

  async function toggleSeal(location: string, currentlySealed: boolean) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    if (currentlySealed) {
      await supabase.from("full_bags").delete().eq("location", location);
    } else {
      await supabase.from("full_bags").insert({ location });
    }
    fetchSealed().catch(() => {});
  }

  async function fetchStorage() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let allCopies: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("card_copies")
        .select("storage_location, card_id, cards(set_name)")
        .eq("sold", false)
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      allCopies = allCopies.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    const locationMap = new Map<string, number>();
    const cardTypeMap = new Map<string, Set<string>>();
    const suffixSetMap = new Map<string, Set<string>>();
    let noLocation = 0;

    for (const row of allCopies) {
      if (!row.storage_location) { noLocation++; continue; }
      locationMap.set(row.storage_location, (locationMap.get(row.storage_location) ?? 0) + 1);
      if (!cardTypeMap.has(row.storage_location)) cardTypeMap.set(row.storage_location, new Set());
      if (row.card_id) cardTypeMap.get(row.storage_location)!.add(row.card_id);
      const setName = (row.cards as any)?.set_name as string | undefined;
      if (setName) {
        const suffix = parseSuffix(row.storage_location);
        if (!suffixSetMap.has(suffix)) suffixSetMap.set(suffix, new Set());
        suffixSetMap.get(suffix)!.add(setName);
      }
    }

    const allRows: LocationRow[] = Array.from(locationMap.entries())
      .map(([location, totalStock]) => ({ location, totalCards: cardTypeMap.get(location)?.size ?? 0, totalStock }))
      .sort((a, b) => a.location.localeCompare(b.location, undefined, { numeric: true }));

    const groupMap = new Map<string, LocationRow[]>();
    for (const row of allRows) {
      const suffix = parseSuffix(row.location);
      if (!groupMap.has(suffix)) groupMap.set(suffix, []);
      groupMap.get(suffix)!.push(row);
    }

    const built: SuffixGroup[] = Array.from(groupMap.entries())
      .map(([suffix, rows]) => ({
        suffix,
        setName: Array.from(suffixSetMap.get(suffix) ?? []).join(", ") || suffix,
        rows,
        totalStock: rows.reduce((s, r) => s + r.totalStock, 0),
      }))
      .sort((a, b) => a.suffix.localeCompare(b.suffix));

    setGroups(built);
    setUnlocated(noLocation);
    setLoading(false);
  }

  async function fetchBagCards(location: string) {
    setBagLoading(true);
    setSelectedBag(location);
    const supabase = getBrowserSupabase();
    if (!supabase) { setBagLoading(false); return; }
    const { data } = await supabase
      .from("card_copies")
      .select("id, owner, card_id, cards(title, player, card_number, set_name, image_url, parallel)")
      .eq("storage_location", location)
      .eq("sold", false)
      .order("created_at", { ascending: true });
    setBagCards((data ?? []).map((r: any) => ({
      copy_id: r.id,
      card_id: r.card_id,
      owner: r.owner,
      title: r.cards?.player || r.cards?.title || "Untitled",
      card_number: r.cards?.card_number || "—",
      set_name: r.cards?.set_name || "—",
      image_url: r.cards?.image_url || null,
      parallel: r.cards?.parallel || null,
    })));
    setMoves([]);
    setBagLoading(false);
  }

  async function saveMoves() {
    const supabase = getBrowserSupabase();
    if (!supabase || moves.length === 0) return;
    setSaving(true);
    for (const m of moves) {
      if (!m.newLocation.trim()) continue;
      await supabase.from("card_copies").update({ storage_location: m.newLocation.trim().toUpperCase() }).eq("id", m.copy_id);
    }
    setSaving(false);
    setMoves([]);
    if (selectedBag) fetchBagCards(selectedBag).catch(() => {});
    fetchStorage().catch(() => {});
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

  useEffect(() => {
    fetchStorage().catch(() => {});
    fetchSealed().catch(() => {});
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("storage-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "card_copies" }, () => {
        fetchStorage().catch(() => {});
        if (showUnlocated) fetchUnlocatedCards().catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showUnlocated]);

  const totalStock = groups.reduce((s, g) => s + g.totalStock, 0) + unlocated;
  const totalLocations = groups.reduce((s, g) => s + g.rows.length, 0);

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
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{totalLocations}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Total Stock</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{totalStock}</p>
          </div>
          <button
            onClick={() => { setShowUnlocated(true); fetchUnlocatedCards().catch(() => {}); }}
            className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 text-center transition hover:border-amber-300 hover:bg-amber-100/60 cursor-pointer"
          >
            <p className="text-sm text-amber-700">No Location</p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">{unlocated}</p>
            <p className="mt-1 text-[11px] text-amber-600">Click to view →</p>
          </button>
        </div>
      </div>

      {showUnlocated && (
        <section className="rounded-3xl border border-amber-200/60 bg-amber-50/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Cards without a storage location</h2>
              <p className="text-sm text-zinc-500">These cards have stock but no location assigned.</p>
            </div>
            <button onClick={() => setShowUnlocated(false)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900">Close</button>
          </div>
          {unlocatedLoading ? <p className="text-sm text-zinc-500">Loading...</p> : unlocatedCards.length === 0 ? (
            <p className="text-sm text-zinc-500">All cards with stock have a location assigned. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200/60 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-4">Image</th><th className="pb-3 pr-4">#</th><th className="pb-3 pr-4">Player</th><th className="pb-3 pr-4">Set</th><th className="pb-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {unlocatedCards.map((c) => (
                    <tr key={c.id} className="border-b border-amber-100 hover:bg-amber-50/60">
                      <td className="py-3 pr-4">{c.image_url ? <img src={c.image_url} alt="" className="h-10 w-8 rounded object-cover" /> : <div className="h-10 w-8 rounded bg-amber-100" />}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{c.card_number || "—"}</td>
                      <td className="py-3 pr-4 font-medium text-zinc-900">{c.player || c.title || "Untitled"}</td>
                      <td className="py-3 pr-4 text-zinc-600">{c.set_name || "—"}</td>
                      <td className="py-3"><span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">{c.stock}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 px-2">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-zinc-500 px-2">No storage locations assigned yet.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.suffix} className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Suffix · {group.suffix}</p>
                  <h2 className="text-lg font-bold text-zinc-900">{group.setName}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">{group.rows.length} bags</p>
                  <p className="text-lg font-bold text-zinc-900">{group.totalStock} <span className="text-xs font-normal text-zinc-400">cards</span></p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-6">Location</th>
                    <th className="pb-3 pr-6">Card Types</th>
                    <th className="pb-3">Total Stock</th>
                    <th className="pb-3 pl-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.location} className={`border-b border-slate-100 cursor-pointer ${sealedBags.has(row.location) ? "bg-slate-50/80" : "hover:bg-slate-50/50"}`} onClick={() => fetchBagCards(row.location).catch(() => {})}>
                      <td className="py-3 pr-6 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-sm font-bold transition ${sealedBags.has(row.location) ? "bg-slate-200 text-slate-500" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}`}>{row.location}</span>
                        {sealedBags.has(row.location) && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full</span>}
                      </td>
                      <td className="py-3 pr-6 text-zinc-600">{row.totalCards}</td>
                      <td className="py-3"><span className="text-lg font-bold text-zinc-900">{row.totalStock}</span><span className="ml-1.5 text-xs text-zinc-400">cards</span></td>
                      <td className="py-3 pl-4" onClick={e => { e.stopPropagation(); toggleSeal(row.location, sealedBags.has(row.location)).catch(() => {}); }}>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer transition ${sealedBags.has(row.location) ? "bg-teal-100 text-teal-700 hover:bg-teal-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                          {sealedBags.has(row.location) ? "Unmark" : "Mark full"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      {/* Bag drill-down panel */}
      {selectedBag && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedBag(null)}>
          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Bag contents</p>
                <h2 className="text-xl font-black text-zinc-900">{selectedBag}</h2>
              </div>
              <div className="flex items-center gap-2">
                {moves.length > 0 && (
                  <button onClick={saveMoves} disabled={saving} className="rounded-full bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50">
                    {saving ? "Saving..." : `Save ${moves.length} move${moves.length > 1 ? "s" : ""}`}
                  </button>
                )}
                <button onClick={() => setSelectedBag(null)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900">Close ✕</button>
              </div>
            </div>
            {bagLoading ? (
              <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" /></div>
            ) : bagCards.length === 0 ? (
              <p className="px-6 py-10 text-sm text-zinc-500">No unsold cards in this bag.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {bagCards.map((c, i) => (
                  <div key={c.copy_id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                    <span className="w-6 text-center text-xs text-zinc-400">{i + 1}</span>
                    {c.image_url
                      ? <img src={c.image_url} alt="" className="h-12 w-9 rounded object-cover shrink-0" />
                      : <div className="h-12 w-9 rounded bg-slate-100 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{c.title}{c.parallel ? <span className="ml-1.5 text-xs text-amber-600">({c.parallel})</span> : null}</p>
                      <p className="text-xs text-zinc-500">#{c.card_number} · {c.set_name}</p>
                    </div>
                    {c.owner && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">{c.owner}</span>}
                    <input
                      value={moves.find(m => m.copy_id === c.copy_id)?.newLocation ?? ""}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setMoves(prev => {
                          const without = prev.filter(m => m.copy_id !== c.copy_id);
                          return val ? [...without, { copy_id: c.copy_id, newLocation: val }] : without;
                        });
                      }}
                      placeholder="Move to..."
                      className="w-24 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono text-zinc-700 outline-none focus:border-teal-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
