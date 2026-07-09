"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import getBrowserSupabase from "@/lib/supabase/client";
import { formatGBP } from "@/lib/currency";

type CardRow = {
  id: string;
  title?: string;
  player?: string;
  card_number?: string;
  set_name?: string;
  price?: number;
  stock?: number;
  status?: string;
  image_url?: string;
  slug?: string;
};

export default function CardsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || loading || !user) return;

    let mounted = true;
    setIsLoadingCards(true);
    setLoadError(null);

    (async () => {
      const { data, error } = await supabase.from("cards").select("*").order("created_at", { ascending: false });
      if (!mounted) return;

      if (error) {
        setLoadError(error.message || "Unable to load cards.");
        setCards([]);
        setIsLoadingCards(false);
        return;
      }

      setCards((data ?? []) as CardRow[]);
      setIsLoadingCards(false);
    })();

    return () => {
      mounted = false;
    };
  }, [loading, user]);

  if (loading || !user) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-8 text-zinc-600">Checking auth…</div>;
  }

  const total = cards.length;
  const drafts = cards.filter((c) => c.status === "draft").length;
  const published = cards.filter((c) => c.status === "published").length;
  const lowStock = cards.filter((c) => (c.stock ?? 0) <= 2).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Cards</h1>
            <p className="mt-2 text-sm text-zinc-600">Manage card drafts, published listings, and stock levels.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/cards/new" className="rounded-full border border-amber-400/40 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900">
              Add Card
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Total cards</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Drafts</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{drafts}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{published}</p>
          </div>
          <div className="rounded-2xl border border-slate-300/60 bg-white/90 p-4 text-center">
            <p className="text-sm text-zinc-500">Low stock</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{lowStock}</p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Cards library</h2>
          <p className="text-sm text-zinc-600">Cards loaded from Supabase.</p>
        </div>

        {isLoadingCards ? (
          <div className="mt-6 rounded-2xl border border-slate-300/60 bg-white/90 p-6 text-sm text-zinc-600">Loading cards…</div>
        ) : loadError ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">{loadError}</div>
        ) : cards.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-300/60 bg-white/90 p-6 text-sm text-zinc-600">No cards have been saved yet.</div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-grid">
            {cards.map((c) => {
              const statusTone = c.status === "published"
                ? "border-emerald-300/50 bg-emerald-100/80 text-emerald-800"
                : "border-amber-300/50 bg-amber-100/80 text-amber-800";

              return (
                <article key={c.id} className="rounded-3xl border border-slate-300/60 bg-white/95 p-5 card-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.title ?? c.player} className="h-14 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-14 w-12 rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-100" />
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">#{c.card_number ?? "—"}</p>
                        <h3 className="text-sm font-semibold text-zinc-900">{c.title ?? "Untitled card"}</h3>
                        <p className="text-sm text-zinc-600">{c.player ?? "Unknown player"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusTone}`}>
                      {c.status ?? "draft"}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-zinc-600">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <dt>Set</dt>
                      <dd className="font-medium text-zinc-800">{c.set_name ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <dt>Price</dt>
                      <dd className="font-medium text-zinc-800">{typeof c.price === "number" ? formatGBP(c.price) : "-"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Stock</dt>
                      <dd className="font-medium text-zinc-800">{c.stock ?? 0}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/admin/cards/edit/${c.id}`} className="rounded-full border border-slate-300/80 bg-white px-3 py-1 text-sm text-zinc-700">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        const supabase = getBrowserSupabase();
                        if (!supabase) return;
                        const next = c.status === "published" ? "draft" : "published";
                        await supabase.from("cards").update({ status: next }).eq("id", c.id);
                        setCards((cur) => cur.map((r) => (r.id === c.id ? { ...r, status: next } : r)));
                      }}
                      className="rounded-full border border-amber-300/45 bg-amber-50 px-3 py-1 text-sm text-amber-900"
                    >
                      Toggle Publish
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}