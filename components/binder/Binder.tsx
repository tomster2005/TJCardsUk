"use client";

import { useMemo, useState } from "react";
import { useCollection } from "@/contexts/CollectionContext";
import { binderDemoData, type BinderPocket } from "@/lib/demo-data/binder";
import { getCollectionSummary } from "@/lib/collection/utils";
import { CardDetailsPanel } from "./CardDetailsPanel";

function PocketCell({ pocket, isActive, onSelect }: {
  pocket: BinderPocket;
  isActive: boolean;
  onSelect: (p: BinderPocket) => void;
}) {
  const isEmpty = pocket.status === "missing";
  const isRare = pocket.rarityName?.toLowerCase().includes("rare") || pocket.rarityName?.toLowerCase().includes("holo");

  return (
    <button
      type="button"
      onClick={() => onSelect(pocket)}
      className={`relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl transition-all duration-280 focus:outline-none ${
        isEmpty ? "pocket-empty" : `pocket-filled ${isRare ? "card-rare" : ""}`
      }`}
      style={isActive ? { outline: "2px solid #f5d97a", outlineOffset: "2px" } : {}}
    >
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 p-2">
          <span className="text-lg opacity-15">◎</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[rgba(232,230,225,0.25)]">Missing</span>
          <span className="text-[7px] text-[rgba(232,230,225,0.2)]">#{pocket.cardNumber}</span>
        </div>
      ) : (
        <>
          {pocket.imageUrl ? (
            <img src={pocket.imageUrl} alt={pocket.playerName} className="h-full w-full object-cover transition-transform duration-400 hover:scale-[1.06]" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #1c1c22, #2a2a32)" }}>🃏</div>
          )}
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
          {isRare && (
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), transparent 50%, rgba(59,130,246,0.1))" }} />
          )}
          <div className="absolute inset-x-0 bottom-0 p-1.5">
            <p className="truncate text-[8px] font-bold text-white">{pocket.playerName}</p>
          </div>
          {pocket.owned && (
            <span className="absolute left-1 top-1 rounded-full bg-[rgba(34,197,94,0.9)] px-1.5 py-0.5 text-[7px] font-black text-white">✓</span>
          )}
          {pocket.wishlist && !pocket.owned && (
            <span className="absolute left-1 top-1 rounded-full bg-[rgba(249,115,22,0.9)] px-1.5 py-0.5 text-[7px] font-black text-white">♡</span>
          )}
          {pocket.quantity > 1 && (
            <span className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[7px] font-black text-[#0d0d0f]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>{pocket.quantity}×</span>
          )}
          {isRare && (
            <span className="absolute right-1 bottom-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-1 py-0.5 text-[7px] font-black text-white">✦</span>
          )}
          {isActive && (
            <div className="absolute inset-0 rounded-xl" style={{ boxShadow: "inset 0 0 0 2px rgba(245,217,122,0.6)" }} />
          )}
        </>
      )}
    </button>
  );
}

export function Binder() {
  const { pockets } = useCollection();
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activePocketId, setActivePocketId] = useState<string | null>(null);

  const pages = useMemo(() =>
    binderDemoData.pages.map((page) => ({
      ...page,
      pockets: page.pockets.map((pocket) => pockets.find((p) => p.id === pocket.id) ?? pocket),
    })),
    [pockets]
  );

  const activePage = pages[activePageIndex];
  const completion = useMemo(() => getCollectionSummary(pockets).completion, [pockets]);
  const activePocket = useMemo(
    () => pages.flatMap((p) => p.pockets).find((p) => p.id === activePocketId) ?? null,
    [activePocketId, pages]
  );

  const ownedOnPage = activePage.pockets.filter((p) => p.owned).length;
  const totalOnPage = activePage.pockets.length;
  const pageCompletion = Math.round((ownedOnPage / totalOnPage) * 100);

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference - (completion / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(200,155,60,0.8)]">Digital Binder</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-[rgba(232,230,225,0.9)]">{binderDemoData.title}</h1>
          <p className="mt-0.5 text-[13px] text-[rgba(232,230,225,0.4)]">{binderDemoData.description}</p>
        </div>

        {/* Completion ring */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
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
              <text x="26" y="30" textAnchor="middle" style={{ fontSize: 10, fontWeight: 900, fill: "#f5d97a" }}>{completion}%</text>
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[rgba(232,230,225,0.3)]">Complete</span>
          </div>
        </div>
      </div>

      {/* ── Binder Body ─────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

        {/* Leather binder */}
        <div className="binder-cover overflow-hidden rounded-3xl p-1.5" style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)" }}>
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
            <div className="binder-page flex-1 p-5">
              {/* Page header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[rgba(100,100,100,0.7)]">Page {activePageIndex + 1} of {pages.length}</p>
                  <p className="mt-0.5 text-sm font-bold text-[rgba(30,30,30,0.9)]">{activePage.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[rgba(100,100,100,0.7)]">{ownedOnPage}/{totalOnPage}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
                    <div
                      className="h-full rounded-full animate-progress-grow"
                      style={{ width: `${pageCompletion}%`, background: "linear-gradient(90deg, #c89b3c, #f5d97a)" }}
                    />
                  </div>
                </div>
              </div>

              {/* 3×3 grid */}
              <div className="grid grid-cols-3 gap-2">
                {activePage.pockets.map((pocket) => (
                  <PocketCell
                    key={pocket.id}
                    pocket={pocket}
                    isActive={pocket.id === activePocketId}
                    onSelect={(p) => setActivePocketId(p.id === activePocketId ? null : p.id)}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setActivePageIndex((i) => (i === 0 ? pages.length - 1 : i - 1)); setActivePocketId(null); }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[rgba(80,80,80,0.8)] transition hover:bg-[rgba(0,0,0,0.06)] hover:text-[rgba(30,30,30,0.9)]"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  ← Prev
                </button>

                <div className="flex gap-1.5">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActivePageIndex(i); setActivePocketId(null); }}
                      className="rounded-full transition-all duration-200"
                      style={{
                        height: 8,
                        width: i === activePageIndex ? 20 : 8,
                        background: i === activePageIndex ? "#c89b3c" : "rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => { setActivePageIndex((i) => (i + 1) % pages.length); setActivePocketId(null); }}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", color: "#0d0d0f", boxShadow: "0 2px 12px rgba(200,155,60,0.4)" }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div>
          {activePocket ? (
            <CardDetailsPanel pocket={activePocket} />
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl p-8 text-center" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border)" }}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: "rgba(200,155,60,0.08)", border: "1px solid rgba(200,155,60,0.15)" }}>👆</div>
              <p className="font-bold text-[rgba(232,230,225,0.7)]">Select a card</p>
              <p className="mt-1 text-[12px] text-[rgba(232,230,225,0.3)]">Click any pocket to inspect it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
