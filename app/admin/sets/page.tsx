"use client";

import { useEffect, useState } from "react";
import getBrowserSupabase from "@/lib/supabase/client";

const CATEGORIES = ["Football", "Rugby", "Cricket", "Disney", "Basketball", "Baseball", "Other"];

type SetRow = { set_name: string; category: string | null; card_count: number };

export default function SetsPage() {
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("cards")
      .select("set_name, category")
      .eq("status", "published")
      .order("set_name");

    if (!data) { setLoading(false); return; }

    // Group by set_name, pick the first category found
    const map = new Map<string, SetRow>();
    for (const row of data) {
      const key = row.set_name ?? "";
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, { set_name: key, category: row.category ?? null, card_count: 1 });
      } else {
        map.get(key)!.card_count++;
        if (!map.get(key)!.category && row.category) {
          map.get(key)!.category = row.category;
        }
      }
    }
    setSets(Array.from(map.values()).sort((a, b) => a.set_name.localeCompare(b.set_name)));
    setLoading(false);
  }

  async function updateCategory(setName: string, category: string) {
    setSaving(setName);
    const supabase = getBrowserSupabase();
    if (!supabase) { setSaving(null); return; }
    await supabase.from("cards").update({ category: category || null }).eq("set_name", setName);
    setSets((prev) => prev.map((s) => s.set_name === setName ? { ...s, category: category || null } : s));
    setSaving(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-bold text-zinc-900">Card Sets</h1>
        <p className="mt-2 text-zinc-600">Assign a category to each set. All cards in that set will display the category tag.</p>
      </div>

      <div className="rounded-3xl border border-slate-300/60 bg-white/92 shadow-[0_14px_30px_rgba(15,23,42,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-zinc-500">Loading sets...</div>
        ) : sets.length === 0 ? (
          <div className="p-8 text-zinc-500">No published sets found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-6 py-3 font-semibold text-zinc-600">Set Name</th>
                <th className="px-6 py-3 font-semibold text-zinc-600">Cards</th>
                <th className="px-6 py-3 font-semibold text-zinc-600">Category</th>
                <th className="px-6 py-3 font-semibold text-zinc-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => (
                <tr key={s.set_name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-zinc-900">{s.set_name}</td>
                  <td className="px-6 py-3 text-zinc-500">{s.card_count}</td>
                  <td className="px-6 py-3">
                    <select
                      value={s.category ?? ""}
                      onChange={(e) => updateCategory(s.set_name, e.target.value)}
                      disabled={saving === s.set_name}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-amber-400 disabled:opacity-50"
                    >
                      <option value="">— Unset —</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    {saving === s.set_name ? (
                      <span className="text-amber-600 text-xs font-semibold">Saving...</span>
                    ) : s.category ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Set</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Unset</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
