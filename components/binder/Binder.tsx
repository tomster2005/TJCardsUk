"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type BinderSet = {
  id: string;
  title: string;
  description: string | null;
  total_cards: number;
  slug: string;
};

type ChecklistCard = {
  id: string;
  card_number: string;
  player_name: string;
  team: string | null;
  parallel: string | null;
  page_number: number;
  position: number;
  owned: boolean;
  image_url: string | null;
  stock: number;
  community_image: string | null;
  community_credit: string | null;
};

function PocketCell({ card, isActive, onSelect }: {
  card: ChecklistCard;
  isActive: boolean;
  onSelect: () => void;
}) {
  const hasImage = card.image_url || card.community_image;
  const displayImage = card.image_url || card.community_image;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative aspect-[2.5/3.5] min-h-[100px] w-full overflow-hidden rounded-xl transition-all duration-280 focus:outline-none ${
        !hasImage ? "pocket-empty" : "pocket-filled"
      }`}
      style={isActive ? { outline: "2px solid #c89b3c", outlineOffset: "2px" } : {}}
    >
      {!hasImage ? (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 p-2">
          <span className="text-[10px] font-bold text-[rgba(28,25,23,0.5)] text-center leading-tight">{card.player_name}</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.3)]">
            {card.owned ? "No image" : "Missing"}
          </span>
          <span className="text-[7px] text-[rgba(28,25,23,0.25)]">#{card.card_number}</span>
        </div>
      ) : (
        <>
          <img src={displayImage!} alt={card.player_name} className="h-full w-full object-cover transition-transform duration-400 hover:scale-[1.06]" />
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
          <div className="absolute inset-x-0 bottom-0 p-1.5">
            <p className="truncate text-[8px] font-bold text-white">{card.player_name}</p>
            {card.community_credit && !card.image_url && (
              <p className="truncate text-[6px] text-[rgba(255,255,255,0.5)]">Photo: {card.community_credit}</p>
            )}
          </div>
          {card.owned && (
            <span className="absolute left-1 top-1 rounded-full bg-[rgba(34,197,94,0.9)] px-1.5 py-0.5 text-[7px] font-black text-white">In Stock</span>
          )}
          {card.stock > 1 && (
            <span className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[7px] font-black text-[#0d0d0f]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>{card.stock}x</span>
          )}
        </>
      )}
    </button>
  );
}

function UploadModal({ card, onClose, onUploaded }: {
  card: ChecklistCard;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setMessage("");

    try {
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("No client");

      // Get username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const username = profile?.username || "Anonymous";

      // Upload to storage
      const ext = file.name.split(".").pop();
      const path = `community/${card.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(path);

      // Insert community_images record
      const { error: insertError } = await supabase
        .from("community_images")
        .insert({
          checklist_id: card.id,
          image_url: urlData.publicUrl,
          uploaded_by: user.id,
          username,
          status: "pending",
        });

      if (insertError) throw insertError;

      setMessage("Uploaded! Your photo will appear once approved.");
      setTimeout(() => { onUploaded(); onClose(); }, 1500);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1c1917]">Upload Card Photo</h3>
        <p className="mt-1 text-sm text-[rgba(28,25,23,0.5)]">
          #{card.card_number} - {card.player_name}
        </p>
        <p className="mt-2 text-xs text-[rgba(28,25,23,0.4)]">
          Upload your own photo of this card. It will be reviewed before appearing publicly. Your username will be credited.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="mt-4 w-full text-sm"
        />

        {message && (
          <p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
            {message}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-gold rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Submit Photo"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--vault-border)] px-4 py-2 text-sm font-medium text-[rgba(28,25,23,0.6)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function BinderView() {
  const { user } = useAuth();
  const [sets, setSets] = useState<BinderSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistCard[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<ChecklistCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadCard, setUploadCard] = useState<ChecklistCard | null>(null);

  // Load binder sets
  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      const { data } = await supabase.from("binder_sets").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setSets(data);
        setActiveSetId(data[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Load checklist when set changes
  useEffect(() => {
    if (!activeSetId) return;
    loadChecklist();
  }, [activeSetId, sets]);

  async function loadChecklist() {
    if (!activeSetId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const activeSet = sets.find((s) => s.id === activeSetId);

    const { data: checklistData, error: checklistError } = await supabase
      .from("binder_checklist")
      .select("*")
      .eq("set_id", activeSetId)
      .order("page_number")
      .order("position");

    if (checklistError || !checklistData || checklistData.length === 0) {
      setChecklist([]);
      return;
    }

    // Get matching cards from cards table
    const { data: cardsData } = await supabase
      .from("cards")
      .select("card_number, image_url, image_front, stock, set_name")
      .eq("set_name", activeSet?.title || "");

    // Get approved community images
    const checklistIds = checklistData.map((c) => c.id);
    const { data: communityData } = await supabase
      .from("community_images")
      .select("checklist_id, image_url, username")
      .eq("status", "approved")
      .in("checklist_id", checklistIds);

    // Build lookups
    const cardLookup = new Map<string, { image_url: string | null; stock: number }>();
    if (cardsData) {
      for (const c of cardsData) {
        cardLookup.set(c.card_number, {
          image_url: c.image_url || c.image_front || null,
          stock: c.stock || 0,
        });
      }
    }

    const communityLookup = new Map<string, { image_url: string; username: string }>();
    if (communityData) {
      for (const c of communityData) {
        // First approved image wins
        if (!communityLookup.has(c.checklist_id)) {
          communityLookup.set(c.checklist_id, { image_url: c.image_url, username: c.username || "Anonymous" });
        }
      }
    }

    // Merge
    const merged: ChecklistCard[] = checklistData.map((item) => {
      const match = cardLookup.get(item.card_number);
      const community = communityLookup.get(item.id);
      return {
        ...item,
        owned: !!match,
        image_url: match?.image_url || null,
        stock: match?.stock || 0,
        community_image: community?.image_url || null,
        community_credit: community?.username || null,
      };
    });

    setChecklist(merged);
    setActivePageIndex(0);
    setSelectedCard(null);
  }

  const activeSet = sets.find((s) => s.id === activeSetId);
  const totalPages = activeSet ? Math.ceil(activeSet.total_cards / 9) : 1;
  const pageCards = useMemo(
    () => checklist.filter((c) => c.page_number === activePageIndex + 1),
    [checklist, activePageIndex]
  );
  const ownedCount = checklist.filter((c) => c.owned).length;
  const completion = checklist.length > 0 ? Math.round((ownedCount / checklist.length) * 100) : 0;
  const ownedOnPage = pageCards.filter((c) => c.owned).length;
  const pageCompletion = pageCards.length > 0 ? Math.round((ownedOnPage / pageCards.length) * 100) : 0;

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference - (completion / 100) * circumference;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-[rgba(28,25,23,0.5)]">Loading binders...</div>;
  }

  if (sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-bold text-[#1c1917]">No binder sets yet</p>
        <p className="mt-1 text-sm text-[rgba(28,25,23,0.5)]">Create one in the admin panel with a CSV checklist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">Digital Binder</span>
          <h1 className="mt-1 text-2xl font-black text-[#1c1917] font-display">{activeSet?.title}</h1>
          <p className="mt-0.5 text-[13px] text-[rgba(28,25,23,0.5)]">{activeSet?.description || `${ownedCount} of ${checklist.length} collected`}</p>
        </div>

        {/* Completion ring */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
              <circle
                cx="26" cy="26" r="20"
                fill="none"
                stroke="#c89b3c"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 26 26)"
                style={{ filter: "drop-shadow(0 0 4px rgba(200,155,60,0.5))", transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
              />
              <text x="26" y="30" textAnchor="middle" style={{ fontSize: 10, fontWeight: 900, fill: "#a07828" }}>{completion}%</text>
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">Complete</span>
          </div>
        </div>
      </div>

      {/* Set selector (if multiple) */}
      {sets.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {sets.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSetId(s.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                s.id === activeSetId
                  ? "btn-gold"
                  : "border border-[var(--vault-border)] text-[rgba(28,25,23,0.6)] hover:bg-[rgba(0,0,0,0.04)]"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Binder Body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* Leather binder */}
        <div className="binder-cover overflow-hidden rounded-3xl p-2" style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)" }}>
          <div className="flex overflow-hidden rounded-[1.3rem]">

            {/* Spine */}
            <div className="binder-spine flex w-7 flex-shrink-0 flex-col items-center justify-between py-6">
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-1 w-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-1 w-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                ))}
              </div>
            </div>

            {/* Page */}
            <div className="binder-page flex-1 p-6">
              {/* Page header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[rgba(100,100,100,0.7)]">Page {activePageIndex + 1} of {totalPages}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[rgba(100,100,100,0.7)]">{ownedOnPage}/{pageCards.length}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
                    <div
                      className="h-full rounded-full animate-progress-grow"
                      style={{ width: `${pageCompletion}%`, background: "linear-gradient(90deg, #c89b3c, #f5d97a)" }}
                    />
                  </div>
                </div>
              </div>

              {/* 3x3 grid */}
              <div className="grid grid-cols-3 gap-3">
                {pageCards.map((card) => (
                  <PocketCell
                    key={card.id}
                    card={card}
                    isActive={card.id === selectedCard?.id}
                    onSelect={() => setSelectedCard(card.id === selectedCard?.id ? null : card)}
                  />
                ))}
                {pageCards.length === 0 && (
                  <div className="col-span-3 py-12 text-center text-sm text-[rgba(28,25,23,0.4)]">
                    No cards on this page
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setActivePageIndex((i) => (i === 0 ? totalPages - 1 : i - 1)); setSelectedCard(null); }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[rgba(80,80,80,0.8)] transition hover:bg-[rgba(0,0,0,0.06)] hover:text-[rgba(30,30,30,0.9)]"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  Prev
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActivePageIndex(i); setSelectedCard(null); }}
                      className="rounded-full transition-all duration-200"
                      style={{
                        height: 8,
                        width: i === activePageIndex ? 20 : 8,
                        background: i === activePageIndex ? "#c89b3c" : "rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}
                  {totalPages > 10 && <span className="text-[10px] text-[rgba(28,25,23,0.4)] self-center ml-1">+{totalPages - 10}</span>}
                </div>

                <button
                  type="button"
                  onClick={() => { setActivePageIndex((i) => (i + 1) % totalPages); setSelectedCard(null); }}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", color: "#0d0d0f", boxShadow: "0 2px 12px rgba(200,155,60,0.4)" }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div>
          {selectedCard ? (
            <aside className="overflow-hidden rounded-2xl" style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border-hi)", boxShadow: "var(--shadow-sm)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--vault-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Card Details</p>
                <h3 className="mt-1 text-base font-black text-[#1c1917]">{selectedCard.player_name}</h3>
                <p className="text-[12px] text-[rgba(28,25,23,0.5)]">#{selectedCard.card_number}{selectedCard.team ? ` - ${selectedCard.team}` : ""}</p>
              </div>

              {/* Image */}
              <div className="p-4">
                <div className="relative h-52 overflow-hidden rounded-xl">
                  {(selectedCard.image_url || selectedCard.community_image) ? (
                    <>
                      <img src={(selectedCard.image_url || selectedCard.community_image)!} alt={selectedCard.player_name} className="h-full w-full object-contain" />
                      {selectedCard.community_credit && !selectedCard.image_url && (
                        <p className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white">
                          Photo: {selectedCard.community_credit}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #f0ede6, #e8e4dc)" }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.3)]">
                        {selectedCard.owned ? "No image" : "Not collected"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload button - only for logged in users when no image exists */}
                {user && !selectedCard.image_url && (
                  <button
                    onClick={() => setUploadCard(selectedCard)}
                    className="mt-3 w-full rounded-xl py-2 text-[12px] font-semibold text-[var(--gold-600)] transition hover:bg-[rgba(200,155,60,0.06)]"
                    style={{ border: "1px solid rgba(200,155,60,0.25)" }}
                  >
                    Upload a photo of this card
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--vault-border)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">Status</p>
                  <p className={`mt-0.5 text-[12px] font-bold ${selectedCard.owned ? "text-green-700" : "text-[rgba(28,25,23,0.5)]"}`}>
                    {selectedCard.owned ? "In Stock" : "Missing"}
                  </p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--vault-border)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">Parallel</p>
                  <p className="mt-0.5 truncate text-[12px] font-bold text-[#1c1917]">{selectedCard.parallel || "Base"}</p>
                </div>
                {selectedCard.owned && (
                  <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--vault-border)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">Stock</p>
                    <p className="mt-0.5 text-[12px] font-bold text-[#1c1917]">{selectedCard.stock}</p>
                  </div>
                )}
              </div>
            </aside>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl p-8 text-center" style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)" }}>
              <p className="font-bold text-[#1c1917]">Select a card</p>
              <p className="mt-1 text-[12px] text-[rgba(28,25,23,0.5)]">Click any pocket to inspect it</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload modal */}
      {uploadCard && (
        <UploadModal
          card={uploadCard}
          onClose={() => setUploadCard(null)}
          onUploaded={() => loadChecklist()}
        />
      )}
    </div>
  );
}
