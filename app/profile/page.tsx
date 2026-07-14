"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { VaultLoader } from "@/components/VaultLoader";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{ username: string | null; role: string; created_at: string } | null>(null);
  const [stats, setStats] = useState({ binderSets: 0, collected: 0 });
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadProfile();
  }, [user, authLoading]);

  async function loadProfile() {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return;

    const { data } = await supabase
      .from("profiles")
      .select("username, role, created_at")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username || "");
    }

    // Get binder stats
    const { count: collectedCount } = await supabase
      .from("user_binder_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: binderCount } = await supabase
      .from("binder_sets")
      .select("*", { count: "exact", head: true });

    setStats({
      collected: collectedCount || 0,
      binderSets: binderCount || 0,
    });
  }

  async function saveUsername() {
    if (!user || !username.trim()) return;
    setSaving(true);
    setMessage(null);

    const supabase = getBrowserSupabase();
    if (!supabase) { setSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message.includes("unique") ? "Username already taken" : error.message });
    } else {
      setMessage({ type: "success", text: "Username updated" });
      setEditing(false);
      setProfile((p) => p ? { ...p, username: username.trim() } : p);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  if (authLoading) {
    return <Layout><VaultLoader /></Layout>;
  }

  if (!user) return null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "—";

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-8 animate-fade-up">

        {/* Header */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">Profile</span>
          <h1 className="mt-1 text-3xl font-black text-zinc-900 font-display">Your Account</h1>
        </div>

        {/* Profile card */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 16px rgba(200,155,60,0.4)" }}>
                {(profile?.username || user.email)?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1 min-w-0">
                {/* Username */}
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="rounded-xl border border-[rgba(200,155,60,0.3)] bg-white px-3 py-2 text-lg font-bold text-zinc-900 outline-none focus:border-[rgba(200,155,60,0.6)]"
                      autoFocus
                    />
                    <button onClick={saveUsername} disabled={saving} className="btn-gold rounded-lg px-3 py-2 text-[12px] font-bold disabled:opacity-50">
                      {saving ? "..." : "Save"}
                    </button>
                    <button onClick={() => { setEditing(false); setUsername(profile?.username || ""); }} className="rounded-lg px-3 py-2 text-[12px] font-medium text-zinc-500 hover:text-zinc-700">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-zinc-900">{profile?.username || "No username set"}</h2>
                    <button onClick={() => setEditing(true)} className="rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--gold-600)] hover:bg-[rgba(200,155,60,0.08)]">
                      Edit
                    </button>
                  </div>
                )}

                <p className="mt-0.5 text-[13px] text-zinc-500">{user.email}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: profile?.role === "admin" ? "rgba(200,155,60,0.15)" : "rgba(0,0,0,0.05)", color: profile?.role === "admin" ? "#92400e" : "#71717a", border: `1px solid ${profile?.role === "admin" ? "rgba(200,155,60,0.3)" : "rgba(0,0,0,0.08)"}` }}>
                    {profile?.role || "user"}
                  </span>
                  <span className="text-[11px] text-zinc-400">Member since {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-4 rounded-xl px-4 py-2.5 text-[13px] font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Cards Collected</p>
            <p className="mt-1 text-3xl font-black text-zinc-900">{stats.collected}</p>
            <p className="mt-1 text-[11px] text-zinc-400">Across all binders</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Binders Available</p>
            <p className="mt-1 text-3xl font-black text-zinc-900">{stats.binderSets}</p>
            <p className="mt-1 text-[11px] text-zinc-400">Sets to complete</p>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">Account Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => { signOut(); router.push("/login"); }}
              className="rounded-xl border border-rose-200 px-5 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Sign out
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
