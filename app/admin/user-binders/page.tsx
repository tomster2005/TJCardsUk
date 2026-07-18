"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type UserBinder = {
  id: string;
  name: string;
  set_name: string;
  year: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  user_id: string;
  username?: string;
  card_count?: number;
};

export default function UserBindersAdminPage() {
  const [binders, setBinders] = useState<UserBinder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const { data } = await supabase
      .from("user_binders")
      .select("*, profiles(username), user_binder_cards(count)")
      .order("created_at", { ascending: false });

    if (data) {
      setBinders(data.map((b: any) => ({
        ...b,
        username: b.profiles?.username || "Anonymous",
        card_count: b.user_binder_cards?.[0]?.count ?? 0,
      })));
    }
    setLoading(false);
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("user_binders").update({ published: !current }).eq("id", id);
    setBinders((prev) => prev.map((b) => b.id === id ? { ...b, published: !current } : b));
  }

  async function deleteBinder(id: string) {
    if (!confirm("Delete this binder permanently?")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("user_binders").delete().eq("id", id);
    setBinders((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1c1917]">User Binders</h1>
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Review and publish community-created binders</p>
      </div>

      {loading ? (
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Loading...</p>
      ) : binders.length === 0 ? (
        <p className="text-sm text-[rgba(28,25,23,0.5)]">No user binders yet.</p>
      ) : (
        <div className="space-y-3">
          {binders.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-[var(--vault-border)] bg-white p-4">
              {b.cover_image_url && (
                <img src={b.cover_image_url} alt={b.name} className="h-14 w-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1c1917] truncate">{b.name}</p>
                <p className="text-xs text-[rgba(28,25,23,0.5)]">{b.set_name} · {b.year} · {b.card_count} cards · by {b.username}</p>
                <p className="text-[10px] text-[rgba(28,25,23,0.3)]">{new Date(b.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${b.published ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {b.published ? "Published" : "Private"}
                </span>
                <button
                  onClick={() => togglePublished(b.id, b.published)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${b.published ? "border border-red-200 text-red-600 hover:bg-red-50" : "btn-gold"}`}
                >
                  {b.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => deleteBinder(b.id)}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
