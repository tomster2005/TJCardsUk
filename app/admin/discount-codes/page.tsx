"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  active: boolean;
  created_at: string;
};

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (!code) return;
    setSaving(true);
    setMessage(null);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error } = await supabase
      .from("discount_codes")
      .insert({ code, type: "free_shipping", active: true });
    if (error) {
      setMessage({ text: error.message.includes("unique") ? "That code already exists." : error.message, error: true });
    } else {
      setMessage({ text: `Code "${code}" created.`, error: false });
      setNewCode("");
      loadCodes();
    }
    setSaving(false);
  }

  async function handleToggle(id: string, current: boolean) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("discount_codes").update({ active: !current }).eq("id", id);
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c));
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete code "${code}"?`)) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("discount_codes").delete().eq("id", id);
    setCodes(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1c1917]">Discount Codes</h1>
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Create and manage discount codes for customers</p>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-[var(--vault-border)] bg-[var(--vault-surface)] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#1c1917]">New Code</h2>
        <div className="flex gap-3">
          <input
            value={newCode}
            onChange={e => setNewCode(e.target.value.toUpperCase())}
            placeholder="e.g. FREESHIP"
            className="flex-1 rounded-xl border border-[var(--vault-border)] bg-white px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-[rgba(200,155,60,0.4)]"
            required
          />
          <div className="rounded-xl border border-[var(--vault-border)] bg-white px-4 py-2.5 text-sm text-zinc-500 flex items-center">
            Free shipping
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-gold rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
        {message && (
          <p className={`text-sm font-medium ${message.error ? "text-red-600" : "text-green-700"}`}>
            {message.text}
          </p>
        )}
      </form>

      {/* Existing codes */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#1c1917]">Existing Codes</h2>
        {loading ? (
          <p className="text-sm text-[rgba(28,25,23,0.5)]">Loading...</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-[rgba(28,25,23,0.5)]">No codes yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {codes.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--vault-border)] bg-[var(--vault-surface)] px-5 py-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-base font-bold text-[#1c1917]">{c.code}</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    Free shipping
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.active ? "bg-green-50 text-green-700 border border-green-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                    {c.active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(c.id, c.active)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${c.active ? "text-zinc-600 hover:bg-zinc-100" : "text-green-600 hover:bg-green-50"}`}
                  >
                    {c.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.code)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
