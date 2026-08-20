"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import getBrowserSupabase from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatGBP } from "@/lib/currency";

type FeaturedCard = {
  id: string;
  player: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
  price: number;
  parallel: string | null;
};

type Stats = {
  totalCards: number;
  totalStock: number;
  sets: number;
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    (async () => {
      const [{ data: cardData }, { data: allCards }] = await Promise.all([
        supabase
          .from("cards")
          .select("id, player, set_name, card_number, image_url, price, parallel")
          .eq("status", "published")
          .gt("stock", 0)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("cards")
          .select("id, set_name, stock")
          .eq("status", "published"),
      ]);
      setCards((cardData ?? []) as FeaturedCard[]);
      const all = allCards ?? [];
      setStats({
        totalCards: all.length,
        totalStock: all.reduce((s: number, c: any) => s + (c.stock || 0), 0),
        sets: new Set(all.map((c: any) => c.set_name)).size,
      });
    })();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>

      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.5) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="absolute -left-40 top-1/4 h-[600px] w-[600px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #f5d97a, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute -right-40 bottom-1/4 h-[500px] w-[500px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #c89b3c, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 20px rgba(200,155,60,0.4)" }}>C</span>
          <div>
            <p className="text-[15px] font-bold tracking-wide text-white">Collectra</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[rgba(200,155,60,0.6)]">The Vault</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/catalogue" className="hidden sm:block text-[13px] text-[rgba(255,255,255,0.5)] hover:text-white transition">Browse</Link>
          {!loading && (
            user ? (
              <Link href="/dashboard" className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#1a0e00] transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>
                My Vault →
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-[13px] text-[rgba(255,255,255,0.5)] hover:text-white transition">Sign in</Link>
                <Link href="/register" className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#1a0e00] transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}>
                  Join free
                </Link>
              </div>
            )
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,155,60,0.2)] bg-[rgba(200,155,60,0.06)] px-4 py-1.5 mb-8">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[rgba(200,155,60,0.8)]">Store open</span>
        </div>

        <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl" style={{ lineHeight: 1.05 }}>
          Every card.<br />
          <span style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Every moment.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[rgba(255,255,255,0.45)]">
          Premium trading cards — Football, Disney and more. Browse, buy, and track your collection all in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/catalogue" className="rounded-full px-8 py-3.5 text-[14px] font-black text-[#1a0e00] transition hover:opacity-90 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 24px rgba(200,155,60,0.4)" }}>
            Browse Cards →
          </Link>
          <Link href="/binder" className="rounded-full border border-[rgba(255,255,255,0.1)] px-8 py-3.5 text-[14px] font-semibold text-[rgba(255,255,255,0.7)] transition hover:border-[rgba(255,255,255,0.2)] hover:text-white">
            View Binder
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {[
              { label: "Cards listed", value: stats.totalCards },
              { label: "In stock", value: stats.totalStock },
              { label: "Sets", value: stats.sets },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.3)]">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured cards */}
      {cards.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Latest arrivals</h2>
            <Link href="/catalogue" className="text-[13px] text-[rgba(200,155,60,0.7)] hover:text-[#c89b3c] transition">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {cards.slice(0, 8).map(card => (
              <Link
                key={card.id}
                href="/catalogue"
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5"
                style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
              >
                <div className="relative overflow-hidden" style={{ paddingBottom: "140%" }}>
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.player} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-10">🃏</div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="truncate text-[12px] font-bold text-white">{card.player}</p>
                    <p className="truncate text-[10px] text-[rgba(255,255,255,0.45)]">{card.set_name}</p>
                    <p className="mt-1 text-[13px] font-black text-[#f5d97a]">{formatGBP(card.price)}</p>
                  </div>
                  {card.parallel && (
                    <div className="absolute top-2 right-2 rounded-full bg-[rgba(200,155,60,0.9)] px-2 py-0.5 text-[9px] font-bold text-[#1a0e00]">
                      {card.parallel}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-lg font-bold text-white">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/catalogue" className="group relative overflow-hidden rounded-2xl p-8 transition hover:-translate-y-1" style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05))", border: "1px solid rgba(22,163,74,0.2)" }}>
            <p className="text-4xl mb-3">⚽</p>
            <p className="text-xl font-black text-white">Football Cards</p>
            <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.4)]">Premier League, Topps, Panini & more</p>
            <span className="mt-4 inline-block text-[12px] font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">Browse →</span>
          </Link>
          <Link href="/catalogue" className="group relative overflow-hidden rounded-2xl p-8 transition hover:-translate-y-1" style={{ background: "linear-gradient(135deg, rgba(59,91,219,0.15), rgba(204,93,232,0.08))", border: "1px solid rgba(59,91,219,0.2)" }}>
            <p className="text-4xl mb-3">✨</p>
            <p className="text-xl font-black text-white">Disney Cards</p>
            <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.4)]">Topps Disney 100, Lorcana & more</p>
            <span className="mt-4 inline-block text-[12px] font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">Browse →</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      {!loading && !user && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 text-center">
          <div className="rounded-3xl p-12" style={{ background: "rgba(200,155,60,0.06)", border: "1px solid rgba(200,155,60,0.15)" }}>
            <h2 className="text-3xl font-black text-white">Start your collection</h2>
            <p className="mt-3 text-[14px] text-[rgba(255,255,255,0.4)]">Create a free account to track your collection, use the community binder, and get order updates.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="rounded-full px-8 py-3.5 text-[14px] font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 24px rgba(200,155,60,0.4)" }}>
                Create free account
              </Link>
              <Link href="/login" className="rounded-full border border-[rgba(255,255,255,0.1)] px-8 py-3.5 text-[14px] font-semibold text-[rgba(255,255,255,0.6)] hover:text-white transition">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.05)] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-[rgba(255,255,255,0.2)]">© {new Date().getFullYear()} Collectra. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-[12px] text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.5)] transition">Terms</Link>
            <Link href="/returns" className="text-[12px] text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.5)] transition">Returns</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
