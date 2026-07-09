"use client";

import { Layout } from "@/components/Layout";
import { useCollection } from "@/contexts/CollectionContext";
import { getWishlistItems } from "@/lib/collection/utils";
import Link from "next/link";

export default function WishlistPage() {
  const { pockets } = useCollection();
  const wishlistCards = getWishlistItems(pockets);

  return (
    <Layout>
      <div className="space-y-10 animate-fade-up">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl" style={{ minHeight: 280 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #120800 0%, #1f0e00 40%, #0d0d0f 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 10% -10%, rgba(249,115,22,0.2), transparent)" }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          <div className="relative p-8 sm:p-12">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(249,115,22,0.8)]">♡</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(249,115,22,0.8)]">Wishlist</span>
                </div>
                <h1 className="text-3xl font-black text-white sm:text-4xl">
                  {wishlistCards.length > 0
                    ? <>{wishlistCards.length} cards you're <span style={{ color: "#fb923c" }}>hunting</span></>
                    : "Your hunt list is empty"
                  }
                </h1>
                <p className="text-[14px] text-[rgba(232,230,225,0.4)]">Track the cards you want. Never miss a drop.</p>
              </div>
              <Link href="/catalogue" className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">Browse cards →</Link>
            </div>
          </div>
        </section>

        {/* ── Empty ─────────────────────────────────────────────────────── */}
        {wishlistCards.length === 0 && (
          <div className="rounded-3xl p-16 text-center" style={{ background: "var(--vault-raised)", border: "1px solid var(--vault-border-hi)" }}>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>♡</div>
            <h2 className="text-xl font-black text-[rgba(232,230,225,0.8)]">Nothing on your hunt list yet</h2>
            <p className="mt-2 max-w-sm mx-auto text-[13px] text-[rgba(232,230,225,0.35)]">Browse the vault and mark cards you want to track them down.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/catalogue" className="btn-gold rounded-full px-6 py-3 text-sm">Browse catalogue</Link>
              <Link href="/missing-cards" className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-semibold text-[rgba(232,230,225,0.6)] transition hover:text-[rgba(232,230,225,0.9)]">View missing cards</Link>
            </div>
          </div>
        )}

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {wishlistCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-grid">
            {wishlistCards.map((card, index) => (
              <article key={card.id} className="card-lift relative overflow-hidden rounded-2xl" style={{ background: "var(--vault-raised)", border: "1px solid rgba(249,115,22,0.12)" }}>
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #f97316, #fb923c, #f97316)" }} />
                <div className="relative flex h-52 items-center justify-center" style={{ background: "linear-gradient(135deg, #120800, #1f0e00)" }}>
                  <span className="text-6xl opacity-8">♡</span>
                  <span className="absolute left-3 top-3 badge-wishlist rounded-full px-2.5 py-1 text-[9px] font-black">Wishlist</span>
                  <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black text-[rgba(232,230,225,0.4)]" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>#{index + 1}</span>
                </div>
                <div className="p-4">
                  <p className="font-black text-[rgba(232,230,225,0.9)]">#{card.cardNumber} {card.playerName}</p>
                  <p className="mt-0.5 text-[12px] text-[rgba(232,230,225,0.4)]">{card.teamName}</p>
                  <p className="mt-0.5 text-[11px] text-[rgba(232,230,225,0.3)]">{card.parallelName}</p>
                  <Link href="/catalogue" className="mt-4 block w-full rounded-full py-2.5 text-center text-[12px] font-bold text-[rgba(232,230,225,0.9)] transition hover:text-white" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                    Find this card →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {wishlistCards.length > 0 && (
          <div className="rounded-3xl p-8 text-center" style={{ background: "rgba(200,155,60,0.04)", border: "1px solid rgba(200,155,60,0.12)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgba(200,155,60,0.6)]">Ready to buy?</p>
            <h3 className="mt-2 text-xl font-black text-[rgba(232,230,225,0.9)]">Find your wishlist cards in the vault</h3>
            <Link href="/catalogue" className="btn-gold mt-5 inline-flex rounded-full px-6 py-3 text-sm">Browse catalogue →</Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
