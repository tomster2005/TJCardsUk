"use client";

import { useEffect, useMemo, useState, useRef, forwardRef, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VaultLoader } from "@/components/VaultLoader";
import { EmptyState } from "@/components/EmptyState";
import HTMLFlipBook from "react-pageflip";

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
  image_url: string | null;
  stock: number;
  community_image: string | null;
  community_credit: string | null;
  collected: boolean;
};

function PocketCell({ card, isActive, onSelect, onToggleCollected }: {
  card: ChecklistCard;
  isActive: boolean;
  onSelect: () => void;
  onToggleCollected: () => void;
}) {
  const hasImage = card.image_url || card.community_image;
  const displayImage = card.image_url || card.community_image;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative aspect-[2.5/3.5] min-h-[85px] w-full overflow-hidden rounded-lg transition-all duration-280 focus:outline-none touch-manipulation ${
        !hasImage ? "pocket-empty" : "pocket-filled"
      }`}
      style={isActive ? { outline: "2px solid #c89b3c", outlineOffset: "2px" } : {}}
    >
      {!hasImage ? (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 p-2">
          <span className="text-[10px] font-bold text-[rgba(28,25,23,0.5)] text-center leading-tight">{card.player_name}</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.3)]">
            {card.collected ? "No image" : "Not collected"}
          </span>
          <span className="text-[7px] text-[rgba(28,25,23,0.25)]">#{card.card_number}</span>
        </div>
      ) : (
        <>
          <img src={displayImage!} alt={card.player_name} className="h-full w-full object-cover transition-transform duration-400 hover:scale-[1.06]" />
          {/* Grey overlay for uncollected cards */}
          {!card.collected && (
            <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(80,80,80,0.55)", mixBlendMode: "saturation" }} />
          )}
          {!card.collected && (
            <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(60,60,60,0.35)" }} />
          )}
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
          <div className="absolute inset-x-0 bottom-0 p-1.5">
            <p className="truncate text-[8px] font-bold text-white">{card.player_name}</p>
            {card.community_credit && !card.image_url && (
              <p className="truncate text-[6px] text-[rgba(255,255,255,0.5)]">Photo: {card.community_credit}</p>
            )}
          </div>
          {card.collected && (
            <span className="absolute left-1 top-1 rounded-full bg-[rgba(34,197,94,0.9)] px-1.5 py-0.5 text-[7px] font-black text-white">✓</span>
          )}
          {!card.collected && card.stock > 0 && (
            <span className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[7px] font-black text-[#0d0d0f]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>{card.stock}x</span>
          )}
        </>
      )}
    </button>
  );
}

const BinderPage = forwardRef<HTMLDivElement, {
  pageNum: number;
  totalPages: number;
  cards: ChecklistCard[];
  collectedOnPage: number;
  selectedCard: ChecklistCard | null;
  onSelectCard: (card: ChecklistCard | null) => void;
  onToggleCollected: (card: ChecklistCard) => void;
}>(({ pageNum, totalPages, cards, collectedOnPage, selectedCard, onSelectCard, onToggleCollected }, ref) => (
  <div ref={ref} className="binder-page h-full p-5 pb-8" style={{ background: "#f5f0e8" }}>
    <div className="mb-3 flex items-center justify-between">
      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[rgba(100,100,100,0.7)]">Page {pageNum} of {totalPages}</p>
      <span className="text-[10px] text-[rgba(100,100,100,0.7)]">{collectedOnPage}/{cards.length}</span>
    </div>
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map((card) => (
        <PocketCell
          key={card.id}
          card={card}
          isActive={card.id === selectedCard?.id}
          onSelect={() => onSelectCard(card.id === selectedCard?.id ? null : card)}
          onToggleCollected={() => onToggleCollected(card)}
        />
      ))}
      {cards.length === 0 && (
        <div className="col-span-3 py-12 text-center text-sm text-[rgba(28,25,23,0.4)]">
          No cards on this page
        </div>
      )}
    </div>
  </div>
));
BinderPage.displayName = "BinderPage";

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const username = profile?.username || "Anonymous";

      const ext = file.name.split(".").pop();
      const path = `community/${card.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(path);

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

        <input ref={fileRef} type="file" accept="image/*" className="mt-4 w-full text-sm" />

        {message && (
          <p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
            {message}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={handleUpload} disabled={uploading} className="btn-gold rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50">
            {uploading ? "Uploading..." : "Submit Photo"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-[var(--vault-border)] px-4 py-2 text-sm font-medium text-[rgba(28,25,23,0.6)]">
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
  const [selectedCard, setSelectedCard] = useState<ChecklistCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [uploadCard, setUploadCard] = useState<ChecklistCard | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bookRef = useRef<any>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      const { data } = await supabase.from("binder_sets").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setSets(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!activeSetId) return;
    loadChecklist();
  }, [activeSetId, sets]);

  async function loadChecklist() {
    if (!activeSetId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    setChecklistLoading(true);
    const activeSet = sets.find((s) => s.id === activeSetId);

    const { data: checklistData, error: checklistError } = await supabase
      .from("binder_checklist")
      .select("*")
      .eq("set_id", activeSetId)
      .order("page_number")
      .order("position");

    if (checklistError || !checklistData || checklistData.length === 0) {
      setChecklist([]);
      setChecklistLoading(false);
      return;
    }

    const checklistIds = checklistData.map((c) => c.id);

    // Run all remaining queries in parallel
    const [progressResult, cardsResult, communityResult] = await Promise.all([
      user
        ? supabase
            .from("user_binder_progress")
            .select("checklist_id")
            .eq("user_id", user.id)
            .in("checklist_id", checklistIds)
        : Promise.resolve({ data: null }),
      supabase
        .from("cards")
        .select("card_number, image_url, image_front, stock, set_name")
        .eq("set_name", activeSet?.title || ""),
      supabase
        .from("community_images")
        .select("checklist_id, image_url, username")
        .eq("status", "approved")
        .in("checklist_id", checklistIds),
    ]);

    const collectedSet = new Set<string>(
      (progressResult.data ?? []).map((p: any) => p.checklist_id)
    );
    const cardsData = cardsResult.data;
    const communityData = communityResult.data;

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
        if (!communityLookup.has(c.checklist_id)) {
          communityLookup.set(c.checklist_id, { image_url: c.image_url, username: c.username || "Anonymous" });
        }
      }
    }

    const merged: ChecklistCard[] = checklistData.map((item) => {
      const match = cardLookup.get(item.card_number);
      const community = communityLookup.get(item.id);
      return {
        ...item,
        image_url: match?.image_url || null,
        stock: match?.stock || 0,
        community_image: community?.image_url || null,
        community_credit: community?.username || null,
        collected: collectedSet.has(item.id),
      };
    });

    setChecklist(merged);
    setSelectedCard(null);
    setCurrentPage(0);
    setChecklistLoading(false);
  }

  async function toggleCollected(card: ChecklistCard) {
    if (!user || toggling) return;
    setToggling(true);
    setSelectedCard(card);

    const supabase = getBrowserSupabase();
    if (!supabase) { setToggling(false); return; }

    if (card.collected) {
      await supabase
        .from("user_binder_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("checklist_id", card.id);
    } else {
      await supabase
        .from("user_binder_progress")
        .insert({ user_id: user.id, checklist_id: card.id });
    }

    const updated = checklist.map((c) =>
      c.id === card.id ? { ...c, collected: !c.collected } : c
    );
    setChecklist(updated);
    setSelectedCard({ ...card, collected: !card.collected });
    setToggling(false);
  }

  const activeSet = sets.find((s) => s.id === activeSetId);
  const totalPages = activeSet ? Math.ceil(activeSet.total_cards / 9) : 1;

  const pages = useMemo(() => {
    const p: ChecklistCard[][] = [];
    for (let i = 1; i <= totalPages; i++) {
      p.push(checklist.filter((c) => c.page_number === i));
    }
    return p;
  }, [checklist, totalPages]);

  const collectedCount = checklist.filter((c) => c.collected).length;
  const completion = checklist.length > 0 ? Math.round((collectedCount / checklist.length) * 100) : 0;
  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference - (completion / 100) * circumference;

  const onFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
    setSelectedCard(null);
  }, []);

  if (loading) {
    return <VaultLoader message="Loading binders..." />;
  }

  if (sets.length === 0) {
    return (
      <EmptyState
        icon="ðŸ“–"
        title="No binders available yet"
        description="Binder sets are added by the admin. Check back soon for new sets to collect."
        actions={[
          { label: "Browse catalogue", href: "/catalogue", primary: true },
          { label: "Back to dashboard", href: "/dashboard" },
        ]}
      />
    );
  }

  // Binder selection screen
  if (!activeSetId) {
    return (
      <div className="space-y-10 animate-fade-up">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #2d1a0a 70%, #0d0d0f 100%)", border: "1px solid rgba(200,155,60,0.15)" }}>
          {/* Animated grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          {/* Floating glow orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full opacity-20 animate-pulse" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.4), transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full opacity-15 animate-pulse" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.3), transparent 70%)", animationDelay: "1s" }} />

          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.15), rgba(200,155,60,0.05))", border: "1px solid rgba(200,155,60,0.3)", boxShadow: "0 0 30px rgba(200,155,60,0.15)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c89b3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 7h6" /><path d="M8 11h4" />
              </svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--gold-500)]">The Vault</span>
            <h1 className="mt-3 text-4xl font-black text-white font-display">Your Binders</h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[rgba(255,255,255,0.5)]">
              Open a binder to track your collection. Mark cards as collected and watch your progress grow.
            </p>
          </div>
        </div>

        {/* Binder cards */}
        <div className="mx-auto grid w-full max-w-4xl gap-5 sm:grid-cols-2">
          {sets.map((s, idx) => (            <button
              key={s.id}
              onClick={() => setActiveSetId(s.id)}
              className="group relative overflow-hidden rounded-2xl text-left transition-all duration-400 hover:-translate-y-2 hover:scale-[1.02]"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Card background */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #1a0e06 0%, #2d1a0a 30%, #3d2410 60%, #2d1a0a 100%)" }} />
              {/* Leather texture */}
              <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\")" }} />
              {/* Gold shimmer on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.12) 0%, transparent 50%, rgba(200,155,60,0.08) 100%)" }} />
              {/* Gold border glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.4), 0 0 30px rgba(200,155,60,0.15)" }} />
              {/* Default border */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400 group-hover:opacity-0" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.12)" }} />

              <div className="relative z-10 p-6">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.2), rgba(200,155,60,0.05))", border: "1px solid rgba(200,155,60,0.25)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c89b3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[var(--gold-400)]" style={{ background: "rgba(200,155,60,0.1)", border: "1px solid rgba(200,155,60,0.2)" }}>
                    {s.total_cards} cards
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-xl font-black text-white transition-colors group-hover:text-[var(--gold-300)]">{s.title}</h3>
                {s.description && <p className="mt-1.5 text-[12px] leading-relaxed text-[rgba(255,255,255,0.45)]">{s.description}</p>}

                {/* Bottom CTA */}
                <div className="mt-5 flex items-center gap-2 text-[12px] font-bold text-[var(--gold-500)] transition-all duration-300 group-hover:gap-3">
                  <span>Open binder</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-up ${selectedCard ? "pb-52" : ""}`}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveSetId(null); setChecklist([]); setSelectedCard(null); }}
            className="rounded-full p-2 text-[rgba(28,25,23,0.5)] transition hover:bg-[rgba(0,0,0,0.05)] hover:text-[#1c1917]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">Digital Binder</span>
            <h1 className="mt-1 text-2xl font-black text-[#1c1917] font-display">{activeSet?.title}</h1>
            <p className="mt-0.5 text-[13px] text-[rgba(28,25,23,0.5)]">{collectedCount} of {checklist.length} collected</p>
          </div>
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

      {/* Binder Body */}
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_280px]">

        {/* Binder pages */}
        <div className="binder-cover mx-auto w-full rounded-2xl p-2 sm:rounded-3xl sm:p-3" style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)" }}>

          {checklistLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(200,155,60,0.2)] border-t-[#c89b3c]" />
              <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[rgba(200,155,60,0.6)]">Loading cards...</p>
            </div>
          ) : isMobile ? (
            <div className="rounded-[1.3rem] overflow-hidden">
              {pages[currentPage] && (
                <BinderPage
                  pageNum={currentPage + 1}
                  totalPages={totalPages}
                  cards={pages[currentPage]}
                  collectedOnPage={pages[currentPage].filter((c) => c.collected).length}
                  selectedCard={selectedCard}
                  onSelectCard={setSelectedCard}
                  onToggleCollected={toggleCollected}
                />
              )}
            </div>
          ) : (
            <div className="flex justify-center overflow-hidden rounded-[1.3rem]">
              {/* @ts-ignore - react-pageflip types are loose */}
              <HTMLFlipBook
                ref={bookRef}
                width={340}
                height={480}
                size="stretch"
                minWidth={280}
                maxWidth={400}
                minHeight={400}
                maxHeight={540}
                showCover={false}
                mobileScrollSupport={true}
                onFlip={onFlip}
                className="binder-flipbook"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={600}
                usePortrait={false}
                startZIndex={0}
                autoSize={true}
                maxShadowOpacity={0.4}
                showPageCorners={true}
                disableFlipByClick={true}
                useMouseEvents={false}
                swipeDistance={30}
                clickEventForward={true}
              >
                {pages.map((pageCards, i) => (
                  <BinderPage
                    key={i}
                    pageNum={i + 1}
                    totalPages={totalPages}
                    cards={pageCards}
                    collectedOnPage={pageCards.filter((c) => c.collected).length}
                    selectedCard={selectedCard}
                    onSelectCard={setSelectedCard}
                    onToggleCollected={toggleCollected}
                  />
                ))}
              </HTMLFlipBook>
            </div>
          )}

          {/* Navigation below */}
          <div className="mt-4 flex items-center justify-between px-4 pb-2">
            <button
              type="button"
              onClick={() => isMobile ? setCurrentPage(Math.max(0, currentPage - 1)) : bookRef.current?.pageFlip()?.flipPrev()}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[rgba(200,200,200,0.7)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Prev
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(200,200,200,0.5)]">
              {currentPage + 1} of {totalPages}
            </p>

            <button
              type="button"
              onClick={() => isMobile ? setCurrentPage(Math.min(totalPages - 1, currentPage + 1)) : bookRef.current?.pageFlip()?.flipNext()}
              className="rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", color: "#0d0d0f", boxShadow: "0 2px 12px rgba(200,155,60,0.4)" }}
            >
              Next
            </button>
          </div>
        </div>

        {/* Details panel */}
        <div>
          {selectedCard ? (
            <>
              {/* Mobile: bottom sheet */}
              <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden" style={{ animation: "slide-up 300ms cubic-bezier(0.22,1,0.36,1) both" }}>
                <div
                  className="rounded-t-3xl bg-white border-t border-[rgba(0,0,0,0.08)] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] overflow-y-auto"
                  style={{ maxHeight: "60vh" }}
                >
                <div className="px-5 pt-3" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Card Details</p>
                      <h3 className="mt-0.5 text-base font-black text-[#1c1917] truncate">{selectedCard.player_name}</h3>
                      <p className="text-[12px] text-[rgba(28,25,23,0.5)]">#{selectedCard.card_number}{selectedCard.team ? ` - ${selectedCard.team}` : ""}</p>
                    </div>
                    <button onClick={() => setSelectedCard(null)} className="flex-shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-100">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {user ? (
                      <button
                        onClick={() => toggleCollected(selectedCard)}
                        disabled={toggling}
                        className={`flex-1 rounded-xl py-3 text-[13px] font-bold disabled:opacity-50 ${
                          selectedCard.collected ? "border border-red-200 text-red-600" : "btn-gold"
                        }`}
                      >
                        {toggling ? "..." : selectedCard.collected ? "Remove" : "Mark collected"}
                      </button>
                    ) : (
                      <a href="/login" className="flex-1 rounded-xl py-3 text-center text-[13px] font-bold btn-gold">
                        Sign in to collect
                      </a>
                    )}
                    {user && !selectedCard.image_url && (
                      <button
                        onClick={() => setUploadCard(selectedCard)}
                        className="flex-1 rounded-xl py-3 text-[13px] font-semibold text-[var(--gold-600)] border border-[rgba(200,155,60,0.25)]"
                      >
                        Upload photo
                      </button>
                    )}
                  </div>
                </div>
                </div>
              </div>
              <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSelectedCard(null)} />

              {/* Desktop: sidebar */}
              <aside className="hidden lg:block overflow-hidden rounded-2xl" style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border-hi)", boxShadow: "var(--shadow-sm)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--vault-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gold-500)]">Card Details</p>
                <h3 className="mt-1 text-base font-black text-[#1c1917]">{selectedCard.player_name}</h3>
                <p className="text-[12px] text-[rgba(28,25,23,0.5)]">#{selectedCard.card_number}{selectedCard.team ? ` - ${selectedCard.team}` : ""}</p>
              </div>

              <div className="p-4">
                <div className={`relative h-52 overflow-hidden rounded-xl ${!selectedCard.collected ? "grayscale-[60%] opacity-80" : ""} transition-all duration-300`}>
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
                        {selectedCard.collected ? "No image" : "Not collected"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Collect / Uncollect button */}
                {user && (
                  <button
                    onClick={() => toggleCollected(selectedCard)}
                    disabled={toggling}
                    className={`mt-3 w-full rounded-xl py-2.5 text-[12px] font-bold transition-all duration-300 disabled:opacity-50 ${
                      selectedCard.collected
                        ? "border border-red-200 text-red-600 hover:bg-red-50"
                        : "btn-gold"
                    }`}
                  >
                    : "Mark as collected✓"
                  </button>
                )}

                {/* Upload button */}
                {user && !selectedCard.image_url && (
                  <button
                    onClick={() => setUploadCard(selectedCard)}
                    className="mt-2 w-full rounded-xl py-2 text-[12px] font-semibold text-[var(--gold-600)] transition hover:bg-[rgba(200,155,60,0.06)]"
                    style={{ border: "1px solid rgba(200,155,60,0.25)" }}
                  >
                    Upload a photo
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--vault-border)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">Status</p>
                  <p className={`mt-0.5 text-[12px] font-bold ${selectedCard.collected ? "text-green-700" : "text-[rgba(28,25,23,0.5)]"}`}>
                    {selectedCard.collected ? "Collected" : "Not collected"}
                  </p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--vault-border)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(28,25,23,0.4)]">Parallel</p>
                  <p className="mt-0.5 truncate text-[12px] font-bold text-[#1c1917]">{selectedCard.parallel || "Base"}</p>
                </div>
              </div>
            </aside>
            </>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl p-8 text-center" style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)" }}>
              <p className="font-bold text-[#1c1917]">Select a card</p>
              <p className="mt-1 text-[12px] text-[rgba(28,25,23,0.5)]">Tap any card to mark it as collected</p>
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
