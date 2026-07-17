"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import getBrowserSupabase from "@/lib/supabase/client";
import { formatGBP } from "@/lib/currency";

type CardRow = {
  id: string;
  title?: string;
  player?: string;
  card_number?: string;
  set_name?: string;
  price?: number;
  stock?: number;
  status?: string;
  image_url?: string;
  slug?: string;
  team?: string;
  parallel?: string;
};

type BulkAction = "publish" | "unpublish" | "set_name" | "price" | "stock" | "delete" | null;

export default function CardsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [bulkValue, setBulkValue] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filterSet, setFilterSet] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterParallel, setFilterParallel] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || loading || !user) return;
    let mounted = true;
    setIsLoadingCards(true);
    setLoadError(null);
    (async () => {
      const { data, error } = await supabase.from("cards").select("*").order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) { setLoadError(error.message); setCards([]); setIsLoadingCards(false); return; }
      setCards((data ?? []) as CardRow[]);
      setIsLoadingCards(false);
    })();
    return () => { mounted = false; };
  }, [loading, user]);

  // Filtered cards
  const filteredCards = cards.filter((c) => {
    if (filterSet !== "all" && c.set_name !== filterSet) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterParallel !== "all" && (c.parallel || "") !== filterParallel) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(c.player || "").toLowerCase().includes(q) &&
        !(c.title || "").toLowerCase().includes(q) &&
        !(c.card_number || "").toLowerCase().includes(q) &&
        !(c.team || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const sets = Array.from(new Set(cards.map((c) => c.set_name).filter(Boolean))).sort();
  const parallels = Array.from(new Set(cards.map((c) => c.parallel).filter(Boolean))).sort();
  const allSelected = filteredCards.length > 0 && filteredCards.every((c) => selected.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCards.map((c) => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function executeBulkAction() {
    if (selected.size === 0 || !bulkAction) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setBulkLoading(true);
    const ids = Array.from(selected);

    try {
      if (bulkAction === "delete") {
        if (!confirm(`Delete ${ids.length} cards permanently?`)) { setBulkLoading(false); return; }
        await supabase.from("cards").delete().in("id", ids);
        setCards((cur) => cur.filter((c) => !selected.has(c.id)));
      } else if (bulkAction === "publish") {
        await supabase.from("cards").update({ status: "published" }).in("id", ids);
        setCards((cur) => cur.map((c) => selected.has(c.id) ? { ...c, status: "published" } : c));
      } else if (bulkAction === "unpublish") {
        await supabase.from("cards").update({ status: "draft" }).in("id", ids);
        setCards((cur) => cur.map((c) => selected.has(c.id) ? { ...c, status: "draft" } : c));
      } else if (bulkAction === "set_name" && bulkValue.trim()) {
        await supabase.from("cards").update({ set_name: bulkValue.trim() }).in("id", ids);
        setCards((cur) => cur.map((c) => selected.has(c.id) ? { ...c, set_name: bulkValue.trim() } : c));
      } else if (bulkAction === "price" && bulkValue.trim()) {
        const price = parseFloat(bulkValue);
        if (isNaN(price)) { setBulkLoading(false); return; }
        await supabase.from("cards").update({ price }).in("id", ids);
        setCards((cur) => cur.map((c) => selected.has(c.id) ? { ...c, price } : c));
      } else if (bulkAction === "stock" && bulkValue.trim()) {
        const stock = parseInt(bulkValue);
        if (isNaN(stock)) { setBulkLoading(false); return; }
        await supabase.from("cards").update({ stock }).in("id", ids);
        setCards((cur) => cur.map((c) => selected.has(c.id) ? { ...c, stock } : c));
      }

      setSelected(new Set());
      setBulkAction(null);
      setBulkValue("");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  }

  if (loading || !user) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-8 text-zinc-600">Checking auth...</div>;
  }

  const total = cards.length;
  const drafts = cards.filter((c) => c.status === "draft").length;
  const published = cards.filter((c) => c.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Cards</h1>
            <p className="mt-2 text-sm text-zinc-600">Manage card drafts, published listings, and stock levels.</p>
          </div>
          <Link href="/admin/cards/new" className="rounded-full border border-amber-400/40 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900">
            Add Card
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Total</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{published}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Drafts</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{drafts}</p>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player, card #, team..."
          className="flex-1 min-w-[200px] rounded-xl border border-slate-300/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-300"
        />
        <select value={filterSet} onChange={(e) => setFilterSet(e.target.value)} className="rounded-xl border border-slate-300/60 bg-white px-3 py-2.5 text-sm">
          <option value="all">All sets</option>
          {sets.map((s) => <option key={s} value={s!}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-slate-300/60 bg-white px-3 py-2.5 text-sm">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {parallels.length > 0 && (
          <select value={filterParallel} onChange={(e) => setFilterParallel(e.target.value)} className="rounded-xl border border-slate-300/60 bg-white px-3 py-2.5 text-sm">
            <option value="all">All parallels</option>
            {parallels.map((p) => <option key={p} value={p!}>{p}</option>)}
          </select>
        )}
      </div>

      {/* Bulk Action Toolbar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-50/95 px-5 py-3 shadow-lg backdrop-blur">
          <span className="text-sm font-bold text-amber-900">{selected.size} selected</span>
          <div className="h-5 w-px bg-amber-300/40" />

          <select
            value={bulkAction || ""}
            onChange={(e) => { setBulkAction(e.target.value as BulkAction || null); setBulkValue(""); }}
            className="rounded-lg border border-amber-300/50 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Choose action...</option>
            <option value="publish">Publish all</option>
            <option value="unpublish">Unpublish all</option>
            <option value="set_name">Change set name</option>
            <option value="price">Set price</option>
            <option value="stock">Set stock</option>
            <option value="delete">Delete all</option>
          </select>

          {(bulkAction === "set_name" || bulkAction === "price" || bulkAction === "stock") && (
            <input
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder={bulkAction === "set_name" ? "New set name" : bulkAction === "price" ? "Price (e.g. 2.50)" : "Stock qty"}
              className="rounded-lg border border-amber-300/50 bg-white px-3 py-1.5 text-sm w-40"
            />
          )}

          {bulkAction && (
            <button
              onClick={executeBulkAction}
              disabled={bulkLoading || ((bulkAction === "set_name" || bulkAction === "price" || bulkAction === "stock") && !bulkValue.trim())}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
                bulkAction === "delete" ? "bg-red-600 text-white hover:bg-red-700" : "btn-gold"
              }`}
            >
              {bulkLoading ? "Applying..." : bulkAction === "delete" ? `Delete ${selected.size}` : "Apply"}
            </button>
          )}

          <button
            onClick={() => { setSelected(new Set()); setBulkAction(null); }}
            className="ml-auto text-sm text-amber-700 hover:text-amber-900"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Cards Table */}
      <section className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
        {isLoadingCards ? (
          <div className="p-6 text-sm text-zinc-600">Loading cards...</div>
        ) : loadError ? (
          <div className="p-6 text-sm text-red-600">{loadError}</div>
        ) : filteredCards.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">No cards match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                    />
                  </th>
                  <th className="pb-3 pr-3">Image</th>
                  <th className="pb-3 pr-3">#</th>
                  <th className="pb-3 pr-3">Player</th>
                  <th className="pb-3 pr-3">Set</th>
                  <th className="pb-3 pr-3">Price</th>
                  <th className="pb-3 pr-3">Stock</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((c) => (
                  <tr key={c.id} className={`border-b border-slate-100 transition ${selected.has(c.id) ? "bg-amber-50/50" : "hover:bg-slate-50/50"}`}>
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      {c.image_url ? (
                        <img src={c.image_url} alt="" className="h-10 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-8 rounded bg-slate-100" />
                      )}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-zinc-500">{c.card_number || "-"}</td>
                    <td className="py-3 pr-3 font-medium text-zinc-900">{c.player || c.title || "Untitled"}</td>
                    <td className="py-3 pr-3 text-zinc-600">{c.set_name || "-"}</td>
                    <td className="py-3 pr-3 text-zinc-800">{typeof c.price === "number" ? formatGBP(c.price) : "-"}</td>
                    <td className="py-3 pr-3 text-zinc-800">{c.stock ?? 0}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {c.status || "draft"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        <Link href={`/admin/cards/edit/${c.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-slate-50">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Delete this card?")) return;
                            const supabase = getBrowserSupabase();
                            if (!supabase) return;
                            await supabase.from("cards").delete().eq("id", c.id);
                            setCards((cur) => cur.filter((r) => r.id !== c.id));
                          }}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Del
                        </button>
                      </div>
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
