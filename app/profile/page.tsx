"use client";

import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { VaultLoader } from "@/components/VaultLoader";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  username: string | null;
  role: string;
  created_at: string;
  avatar_url: string | null;
};

type Order = {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: { playerName?: string; cardNumber?: string; quantity?: number }[];
};

type ShowcaseCard = {
  id: string; // profile_showcase.id
  checklist_id: string;
  position: number;
  player_name: string;
  card_number: string;
  parallel: string | null;
  set_title: string;
  image_url: string | null;
};

const QUICK_LINKS = [
  { label: "Vault", href: "/dashboard", icon: "⬡" },
  { label: "Binder", href: "/binder", icon: "📖" },
  { label: "Missing Cards", href: "/missing-cards", icon: "🔍" },
  { label: "Browse", href: "/catalogue", icon: "🛍️" },
];

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ binderSets: 0, collected: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [showcase, setShowcase] = useState<ShowcaseCard[]>([]);
  const [collectedCards, setCollectedCards] = useState<ShowcaseCard[]>([]);
  const [showShowcasePicker, setShowShowcasePicker] = useState(false);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadAll();
  }, [user, authLoading]);

  async function loadAll() {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return;

    const [profileRes, collectedRes, binderCountRes, ordersRes, showcaseRes] = await Promise.all([
      supabase.from("profiles").select("username, role, created_at, avatar_url").eq("id", user.id).single(),
      supabase.from("user_binder_progress").select("checklist_id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("binder_sets").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("id, created_at, total, status, items").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("profile_showcase").select("id, checklist_id, position").eq("user_id", user.id).order("position"),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setUsername(profileRes.data.username || "");
    }

    setStats({
      collected: collectedRes.count || 0,
      binderSets: binderCountRes.count || 0,
    });

    setOrders(ordersRes.data ?? []);

    // Load showcase card details
    if (showcaseRes.data && showcaseRes.data.length > 0) {
      const checklistIds = showcaseRes.data.map((s) => s.checklist_id);
      const { data: checklistData } = await supabase
        .from("binder_checklist")
        .select("id, player_name, card_number, parallel, set_id, binder_sets(title)")
        .in("id", checklistIds);

      // Get images
      const { data: communityImgs } = await supabase
        .from("community_images")
        .select("checklist_id, image_url")
        .eq("status", "approved")
        .in("checklist_id", checklistIds);
      const imgMap = new Map((communityImgs ?? []).map((c) => [c.checklist_id, c.image_url]));

      const cardMap = new Map((checklistData ?? []).map((c) => [c.id, c]));
      setShowcase(
        showcaseRes.data.map((s) => {
          const c = cardMap.get(s.checklist_id);
          return {
            id: s.id,
            checklist_id: s.checklist_id,
            position: s.position,
            player_name: c?.player_name ?? "Unknown",
            card_number: c?.card_number ?? "?",
            parallel: c?.parallel ?? null,
            set_title: (c?.binder_sets as any)?.title ?? "Unknown",
            image_url: imgMap.get(s.checklist_id) ?? null,
          };
        })
      );
    }
  }

  async function loadCollectedForPicker() {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return;

    const { data: progress } = await supabase
      .from("user_binder_progress")
      .select("checklist_id")
      .eq("user_id", user.id)
      .limit(200);

    if (!progress?.length) return;
    const ids = progress.map((p) => p.checklist_id);

    const { data: checklistData } = await supabase
      .from("binder_checklist")
      .select("id, player_name, card_number, parallel, set_id, binder_sets(title)")
      .in("id", ids);

    const { data: communityImgs } = await supabase
      .from("community_images")
      .select("checklist_id, image_url")
      .eq("status", "approved")
      .in("checklist_id", ids);
    const imgMap = new Map((communityImgs ?? []).map((c) => [c.checklist_id, c.image_url]));

    setCollectedCards(
      (checklistData ?? []).map((c) => ({
        id: "",
        checklist_id: c.id,
        position: 0,
        player_name: c.player_name,
        card_number: c.card_number,
        parallel: c.parallel,
        set_title: (c.binder_sets as any)?.title ?? "Unknown",
        image_url: imgMap.get(c.id) ?? null,
      }))
    );
  }

  async function saveUsername() {
    if (!user || !username.trim()) return;
    setSaving(true);
    setMessage(null);
    const supabase = getBrowserSupabase();
    if (!supabase) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", user.id);
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Only allow JPEG, PNG, WEBP — max 5 MB
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      setMessage({ type: "error", text: "Only JPEG, PNG and WEBP images are allowed." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 5MB." });
      return;
    }

    setAvatarUploading(true);
    setMessage(null);
    const supabase = getBrowserSupabase();
    if (!supabase) { setAvatarUploading(false); return; }

    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[file.type] ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setMessage({ type: "error", text: "Upload failed: " + uploadErr.message });
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`; // cache bust

    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p);
    setAvatarUploading(false);
    setMessage({ type: "success", text: "Avatar updated!" });
    setTimeout(() => setMessage(null), 3000);

    // Reset input so same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function addToShowcase(card: ShowcaseCard) {
    if (showcase.length >= 6) return;
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return;
    const position = showcase.length;
    const { data, error } = await supabase
      .from("profile_showcase")
      .insert({ user_id: user.id, checklist_id: card.checklist_id, position })
      .select("id")
      .single();
    if (!error && data) {
      setShowcase((prev) => [...prev, { ...card, id: data.id, position }]);
    }
  }

  async function removeFromShowcase(id: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("profile_showcase").delete().eq("id", id);
    setShowcase((prev) => prev.filter((c) => c.id !== id));
  }

  if (authLoading) return <Layout><VaultLoader /></Layout>;
  if (!user) return null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "—";

  const showcasedIds = new Set(showcase.map((s) => s.checklist_id));

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
              <div className="relative flex-shrink-0">
                <div
                  className="h-16 w-16 overflow-hidden rounded-2xl"
                  style={{ boxShadow: "0 4px 16px rgba(200,155,60,0.4)" }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>
                      {(profile?.username || user.email)?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                {/* Hidden file input — no capture attribute so it opens file picker only, not camera */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] shadow-md transition hover:scale-110 disabled:opacity-50"
                  style={{ border: "1px solid rgba(200,155,60,0.4)" }}
                  title="Change avatar"
                >
                  {avatarUploading ? "…" : "✏️"}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="rounded-xl border border-[rgba(200,155,60,0.3)] bg-white px-3 py-2 text-lg font-bold text-zinc-900 outline-none focus:border-[rgba(200,155,60,0.6)]"
                      autoFocus
                    />
                    <button onClick={saveUsername} disabled={saving} className="btn-gold rounded-lg px-3 py-2 text-[12px] font-bold disabled:opacity-50">
                      {saving ? "…" : "Save"}
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

        {/* Quick links */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">Quick Links</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 rounded-xl py-4 text-center transition hover:-translate-y-0.5"
                style={{ background: "rgba(200,155,60,0.06)", border: "1px solid rgba(200,155,60,0.15)" }}
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-[12px] font-bold text-zinc-700">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Showcase */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">Showcase</h3>
              <p className="mt-0.5 text-[11px] text-zinc-400">Pin up to 6 of your favourite collected cards</p>
            </div>
            {showcase.length < 6 && (
              <button
                onClick={() => { setShowShowcasePicker(true); loadCollectedForPicker(); }}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold transition"
                style={{ background: "rgba(200,155,60,0.1)", color: "var(--gold-600)", border: "1px solid rgba(200,155,60,0.25)" }}
              >
                + Add card
              </button>
            )}
          </div>

          {showcase.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(200,155,60,0.2)] py-10 text-center">
              <p className="text-2xl opacity-30">⭐</p>
              <p className="mt-2 text-[12px] font-semibold text-zinc-400">No cards showcased yet</p>
              <p className="text-[11px] text-zinc-300">Add cards from your collection to show them off</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {showcase.map((card) => (
                <div key={card.id} className="group relative">
                  <div className="aspect-[2.5/3.5] overflow-hidden rounded-xl" style={{ border: "1px solid rgba(200,155,60,0.2)" }}>
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.player_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center" style={{ background: "linear-gradient(135deg, #f0ede6, #e8e4dc)" }}>
                        <p className="text-[9px] font-bold text-zinc-500">{card.player_name}</p>
                        <p className="text-[8px] text-zinc-400">#{card.card_number}</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[9px] font-bold text-zinc-600">{card.player_name}</p>
                  <button
                    onClick={() => removeFromShowcase(card.id)}
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] text-red-500 shadow group-hover:flex"
                    style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order history */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">Order History</h3>
          {orders.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(200,155,60,0.2)] py-10 text-center">
              <p className="text-2xl opacity-30">🧾</p>
              <p className="mt-2 text-[12px] font-semibold text-zinc-400">No orders yet</p>
              <a href="/catalogue" className="mt-2 text-[11px] font-bold text-[var(--gold-600)] hover:underline">Browse the catalogue →</a>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div>
                    <p className="text-[12px] font-bold text-zinc-800">
                      {Array.isArray(order.items) ? order.items.length : 0} item{order.items?.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        background: order.status === "paid" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)",
                        color: order.status === "paid" ? "#15803d" : "#dc2626",
                        border: `1px solid ${order.status === "paid" ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}
                    >
                      {order.status}
                    </span>
                    <p className="text-[13px] font-black text-zinc-900">£{Number(order.total).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account actions */}
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

      {/* Showcase picker modal */}
      {showShowcasePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setShowShowcasePicker(false)}>
          <div className="flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.07)] px-5 py-4">
              <div>
                <h3 className="font-black text-zinc-900">Add to Showcase</h3>
                <p className="text-[12px] text-zinc-400">{6 - showcase.length} slot{6 - showcase.length !== 1 ? "s" : ""} remaining</p>
              </div>
              <button onClick={() => setShowShowcasePicker(false)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {collectedCards.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-zinc-400">No collected cards found</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {collectedCards.map((card) => {
                    const already = showcasedIds.has(card.checklist_id);
                    return (
                      <button
                        key={card.checklist_id}
                        onClick={() => { if (!already) { addToShowcase(card); setShowShowcasePicker(false); } }}
                        disabled={already}
                        className="group relative text-left disabled:opacity-40"
                      >
                        <div className="aspect-[2.5/3.5] overflow-hidden rounded-xl" style={{ border: `1px solid ${already ? "rgba(22,163,74,0.4)" : "rgba(0,0,0,0.08)"}` }}>
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.player_name} className="h-full w-full object-cover transition group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center" style={{ background: "linear-gradient(135deg, #f0ede6, #e8e4dc)" }}>
                              <p className="text-[9px] font-bold text-zinc-500">{card.player_name}</p>
                              <p className="text-[8px] text-zinc-400">#{card.card_number}</p>
                            </div>
                          )}
                          {already && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-500/20">
                              <span className="text-lg">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[9px] font-bold text-zinc-600">{card.player_name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
