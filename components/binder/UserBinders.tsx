"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
};

type UserBinderCard = {
  id: string;
  player_name: string;
  card_number: string;
  set_name: string;
  image_url: string | null;
  position: number;
};

function CreateBinderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [binderSet, setBinderSet] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCreate() {
    if (!name.trim() || !binderSet.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return;
    setSaving(true);
    setError("");

    let cover_image_url: string | null = null;
    const file = fileRef.current?.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `user-binders/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("card-images").upload(path, file);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("card-images").getPublicUrl(path);
        cover_image_url = urlData.publicUrl;
      }
    }

    const { error: insertErr } = await supabase.from("user_binders").insert({
      user_id: user.id,
      name: name.trim(),
      set_name: binderSet.trim(),
      year: year.trim(),
      cover_image_url,
    });

    if (insertErr) { setError(insertErr.message); setSaving(false); return; }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1c1917]">Create Your Binder</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Binder Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Disney Collection" className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Set *</label>
            <input value={binderSet} onChange={(e) => setBinderSet(e.target.value)} placeholder="e.g. Topps Chrome 2024" className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Year (optional)</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2024" className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Cover Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" className="mt-1 w-full text-sm" />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={handleCreate} disabled={saving} className="btn-gold flex-1 rounded-xl py-2 text-sm font-bold disabled:opacity-50">
            {saving ? "Creating..." : "Create Binder"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-[var(--vault-border)] px-4 py-2 text-sm text-[rgba(28,25,23,0.6)]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AddCardModal({ binderId, onClose, onAdded }: { binderId: string; onClose: () => void; onAdded: () => void }) {
  const [playerName, setPlayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [setName, setSetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  async function handleAdd() {
    if (!playerName.trim() || !cardNumber.trim() || !setName.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return;
    setSaving(true);
    setError("");

    let image_url: string | null = null;
    const file = fileRef.current?.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `user-binders/${user.id}/cards/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("card-images").upload(path, file);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("card-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    }

    const { error: insertErr } = await supabase.from("user_binder_cards").insert({
      binder_id: binderId,
      player_name: playerName.trim(),
      card_number: cardNumber.trim(),
      set_name: setName.trim(),
      image_url,
    });

    if (insertErr) { setError(insertErr.message); setSaving(false); return; }
    onAdded();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1c1917]">Add Card</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Player Name *</label>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="e.g. Remy" className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Card Number *</label>
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="e.g. 71" className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Set *</label>
            <input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="e.g. Topps Neon 2026" className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Card Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" className="mt-1 w-full text-sm" />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={handleAdd} disabled={saving} className="btn-gold flex-1 rounded-xl py-2 text-sm font-bold disabled:opacity-50">
            {saving ? "Adding..." : "Add Card"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-[var(--vault-border)] px-4 py-2 text-sm text-[rgba(28,25,23,0.6)]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function UserBinderView({ binder, onBack, isOwner }: { binder: UserBinder; onBack: () => void; isOwner: boolean }) {
  const [cards, setCards] = useState<UserBinderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => { loadCards(); }, [binder.id]);

  async function loadCards() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("user_binder_cards")
      .select("*")
      .eq("binder_id", binder.id)
      .order("created_at");
    setCards(data ?? []);
    setLoading(false);
  }

  async function deleteCard(id: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("user_binder_cards").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 text-[rgba(28,25,23,0.5)] transition hover:bg-[rgba(0,0,0,0.05)]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">
            {binder.published ? "Community Binder" : "My Binder"}
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#1c1917] font-display">{binder.name}</h1>
          <p className="mt-0.5 text-[13px] text-[rgba(28,25,23,0.5)]">{binder.set_name} · {binder.year}{binder.username ? ` · by ${binder.username}` : ""}</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowAddCard(true)} className="btn-gold rounded-full px-4 py-2 text-sm font-bold">
            + Add Card
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Loading cards...</p>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(200,155,60,0.3)] py-20 text-center">
          <p className="text-4xl opacity-20">📋</p>
          <p className="mt-3 font-bold text-[#1c1917]">No cards yet</p>
          {isOwner && (
            <button onClick={() => setShowAddCard(true)} className="btn-gold mt-4 rounded-full px-5 py-2 text-sm font-bold">
              + Add your first card
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.id} className="group relative overflow-hidden rounded-2xl border border-[var(--vault-border)] bg-white">
              <div className="aspect-[2.5/3.5] overflow-hidden bg-[#f5f3ee]">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.player_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl opacity-20">🃏</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-[#1c1917] text-sm truncate">{card.player_name}</p>
                <p className="text-xs text-[rgba(28,25,23,0.5)]">#{card.card_number} · {card.set_name}</p>
              </div>
              {isOwner && (
                <button
                  onClick={() => deleteCard(card.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-400 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          ))}
          {isOwner && (
            <button
              onClick={() => setShowAddCard(true)}
              className="flex aspect-[2.5/3.5] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(200,155,60,0.3)] text-[rgba(200,155,60,0.6)] transition hover:border-[rgba(200,155,60,0.6)] hover:text-[var(--gold-500)]"
            >
              <span className="text-3xl">+</span>
              <span className="mt-1 text-xs font-semibold">Add card</span>
            </button>
          )}
        </div>
      )}

      {showAddCard && (
        <AddCardModal
          binderId={binder.id}
          onClose={() => setShowAddCard(false)}
          onAdded={loadCards}
        />
      )}
    </div>
  );
}

function BinderCard({ binder, onClick, onDelete, isOwner }: {
  binder: UserBinder;
  onClick: () => void;
  onDelete?: () => void;
  isOwner: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-1"
      style={{ background: "linear-gradient(145deg, #1a0e06 0%, #2d1a0a 30%, #3d2410 60%, #2d1a0a 100%)", border: "1px solid rgba(200,155,60,0.15)" }}
    >
      {binder.cover_image_url && (
        <div className="absolute inset-0 opacity-20">
          <img src={binder.cover_image_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.4)" }} />
      <div className="relative z-10 p-5">
        <h3 className="text-lg font-black text-white group-hover:text-[var(--gold-300)] transition-colors">{binder.name}</h3>
        <p className="mt-1 text-[12px] text-[rgba(255,255,255,0.5)]">{binder.set_name} · {binder.year}</p>
        {binder.username && <p className="mt-0.5 text-[11px] text-[rgba(255,255,255,0.3)]">by {binder.username}</p>}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] font-bold text-[var(--gold-500)]">Open →</span>
          {isOwner && onDelete && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-900/70"
            >
              Delete
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function UserBindersView() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"mine" | "community">("mine");
  const [myBinders, setMyBinders] = useState<UserBinder[]>([]);
  const [communityBinders, setCommunityBinders] = useState<UserBinder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeBinder, setActiveBinder] = useState<UserBinder | null>(null);

  useEffect(() => { load(); }, [user]);

  async function load() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setLoading(true);

    const [myRes, communityRes] = await Promise.all([
      user
        ? supabase.from("user_binders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("user_binders")
        .select("*, profiles(username)")
        .eq("published", true)
        .order("created_at", { ascending: false }),
    ]);

    setMyBinders(myRes.data ?? []);
    setCommunityBinders((communityRes.data ?? []).map((b: any) => ({
      ...b,
      username: b.profiles?.username || "Anonymous",
    })));
    setLoading(false);
  }

  async function deleteBinder(id: string) {
    if (!confirm("Delete this binder?")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("user_binders").delete().eq("id", id);
    setMyBinders((prev) => prev.filter((b) => b.id !== id));
    if (activeBinder?.id === id) setActiveBinder(null);
  }

  if (activeBinder) {
    return (
      <UserBinderView
        binder={activeBinder}
        onBack={() => setActiveBinder(null)}
        isOwner={activeBinder.user_id === user?.id}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["mine", "community"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === t ? "btn-gold" : "border border-[var(--vault-border)] text-[rgba(28,25,23,0.6)]"}`}
          >
            {t === "mine" ? "My Binders" : "Community Binders"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Loading...</p>
      ) : tab === "mine" ? (
        <div className="space-y-4">
          {!user ? (
            <p className="text-sm text-[rgba(28,25,23,0.5)]">
              <a href="/login" className="text-[var(--gold-600)] underline">Sign in</a> to create your own binders.
            </p>
          ) : (
            <>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-gold rounded-full px-5 py-2 text-sm font-bold"
              >
                + Create Binder
              </button>
              {myBinders.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(200,155,60,0.3)] py-16 text-center">
                  <p className="text-4xl opacity-20">📖</p>
                  <p className="mt-3 font-bold text-[#1c1917]">No binders yet</p>
                  <p className="mt-1 text-sm text-[rgba(28,25,23,0.5)]">Create your first binder to start tracking your collection</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myBinders.map((b) => (
                    <BinderCard
                      key={b.id}
                      binder={b}
                      onClick={() => setActiveBinder(b)}
                      onDelete={() => deleteBinder(b.id)}
                      isOwner={true}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {communityBinders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(200,155,60,0.3)] py-16 text-center">
              <p className="text-4xl opacity-20">🌍</p>
              <p className="mt-3 font-bold text-[#1c1917]">No community binders yet</p>
              <p className="mt-1 text-sm text-[rgba(28,25,23,0.5)]">Published binders from the community will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communityBinders.map((b) => (
                <BinderCard
                  key={b.id}
                  binder={b}
                  onClick={() => setActiveBinder(b)}
                  isOwner={b.user_id === user?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateBinderModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
