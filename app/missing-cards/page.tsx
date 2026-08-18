"use client";

import { Layout } from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import getBrowserSupabase from "@/lib/supabase/client";
import { fetchAll } from "@/lib/supabase/fetchAll";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

type StoreVariant = {
  id: string;
  parallel: string | null;
  price: number;
  stock: number;
  image_url: string | null;
};

function VariantCartButton({ variants, playerName, cardNumber }: {
  variants: StoreVariant[];
  playerName: string;
  cardNumber: string;
}) {
  const { addToCart, getItemQuantity } = useCart();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const inCart = getItemQuantity(selected.id);
  const soldOut = inCart >= selected.stock;

  return (
    <div className="mt-3 space-y-2">
      {variants.length > 1 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 outline-none focus:border-[rgba(200,155,60,0.4)]"
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.parallel || "Base"} · £{v.price.toFixed(2)} · {v.stock} left
            </option>
          ))}
        </select>
      )}
      <button
        onClick={() => addToCart({
          id: selected.id,
          playerName,
          cardNumber,
          price: selected.price,
          imageUrl: selected.image_url ?? undefined,
          availableQuantity: selected.stock,
        })}
        disabled={soldOut}
        className="w-full rounded-xl py-2 text-[11px] font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", color: "#1a0e00" }}
      >
        {soldOut
          ? "Out of stock"
          : inCart > 0
          ? `In cart (${inCart}) · Add more`
          : `Add to cart · ${selected.parallel || "Base"} · £${selected.price.toFixed(2)}`}
      </button>
    </div>
  );
}

type MissingCard = {
  id: string;
  card_number: string;
  player_name: string;
  team: string | null;
  parallel: string | null;
  set_title: string;
  inStock: boolean;
  storeVariants: StoreVariant[];
};

export default function MissingCardsPage() {
  const { user } = useAuth();
  const [missing, setMissing] = useState<MissingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSet, setFilterSet] = useState("all");
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) { setLoading(false); return; }

      // Get all active binder sets
      const { data: sets } = await supabase
        .from("binder_sets")
        .select("id, title")
        .eq("is_active", true);
      if (!sets || sets.length === 0) { setLoading(false); return; }

      const setIds = sets.map((s) => s.id);
      const setMap = new Map(sets.map((s) => [s.id, s.title]));

      // Get full checklist for active sets (paginated)
      const checklist = await fetchAll<{ id: string; card_number: string; player_name: string; team: string | null; parallel: string | null; set_id: string }>(
        supabase
          .from("binder_checklist")
          .select("id, card_number, player_name, team, parallel, set_id")
          .in("set_id", setIds)
      );
      if (!checklist.length) { setLoading(false); return; }

      // Get what the user has collected (if logged in, paginated)
      let collectedIds = new Set<string>();
      if (user) {
        const progress = await fetchAll<{ checklist_id: string }>(
          supabase
            .from("user_binder_progress")
            .select("checklist_id")
            .eq("user_id", user.id)
        );
        collectedIds = new Set(progress.map((p) => p.checklist_id));
      }

      // Get all published in-stock variants, grouped by "setName|cardNumber"
      const storeCards = await fetchAll<{ id: string; card_number: string; set_name: string; parallel: string | null; price: number; stock: number; image_url: string | null }>(
        supabase
          .from("cards")
          .select("id, card_number, set_name, parallel, price, stock, image_url")
          .eq("status", "published")
          .gt("stock", 0)
      );
      const storeMap = new Map<string, StoreVariant[]>();
      for (const c of storeCards) {
        const key = `${c.set_name}|${c.card_number}`;
        const variant: StoreVariant = { id: c.id, parallel: c.parallel, price: c.price, stock: c.stock, image_url: c.image_url };
        const existing = storeMap.get(key);
        if (existing) existing.push(variant);
        else storeMap.set(key, [variant]);
      }

      const missingCards: MissingCard[] = checklist
        .filter((item) => !collectedIds.has(item.id))
        .map((item) => {
          const title = setMap.get(item.set_id) ?? "Unknown";
          const storeVariants = storeMap.get(`${title}|${item.card_number}`) ?? [];
          return {
            id: item.id,
            card_number: item.card_number,
            player_name: item.player_name,
            team: item.team,
            parallel: item.parallel,
            set_title: title,
            inStock: storeVariants.length > 0,
            storeVariants,
          };
        });

      setMissing(missingCards);
      setLoading(false);
    }
    load();
  }, [user]);

  const sets = useMemo(
    () => Array.from(new Set(missing.map((m) => m.set_title))).sort(),
    [missing]
  );

  const inStockCount = useMemo(() => missing.filter((m) => m.inStock).length, [missing]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return missing.filter((m) => {
      if (inStockOnly && !m.inStock) return false;
      if (filterSet !== "all" && m.set_title !== filterSet) return false;
      if (
        q &&
        !m.player_name.toLowerCase().includes(q) &&
        !m.card_number.includes(q) &&
        !(m.team ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [missing, filterSet, search, inStockOnly]);

  return (
    <Layout>
      <div className="space-y-8 animate-fade-up">

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl"
          style={{
            minHeight: 180,
            background: "linear-gradient(135deg, #fef9ec 0%, #f8f6f2 100%)",
            border: "1px solid rgba(200,155,60,0.15)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 20% -10%, rgba(200,155,60,0.1), transparent)",
            }}
          />
          <div className="relative p-8 sm:p-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">
              Missing Cards
            </span>
            <h1 className="mt-2 text-3xl font-black text-zinc-900 font-display sm:text-4xl">
              {loading
                ? "Loading..."
                : missing.length === 0
                ? "All binders complete!"
                : `${missing.length} cards still needed`}
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              {loading
                ? ""
                : !user
                ? "Sign in to track your personal progress."
                : missing.length === 0
                ? "You've collected every card in your active binders."
                : "Every card from your active binders that you haven't marked as collected."}
            </p>
            {!user && !loading && (
              <a
                href="/login"
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition"
                style={{
                  background: "linear-gradient(135deg, var(--gold-400), var(--gold-500))",
                  color: "#1a0e00",
                }}
              >
                Sign in to track progress
              </a>
            )}
          </div>
        </section>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && missing.length === 0 && (
          <div
            className="rounded-3xl p-16 text-center bg-white"
            style={{ border: "1px solid rgba(22,163,74,0.2)" }}
          >
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
              style={{
                background: "rgba(22,163,74,0.08)",
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              🏆
            </div>
            <h2 className="text-xl font-black text-zinc-800">All binders complete!</h2>
            <p className="mt-2 text-[13px] text-zinc-500">
              {user
                ? "Every card in your active binders is marked as collected."
                : "Sign in to track your collection progress."}
            </p>
          </div>
        )}

        {!loading && missing.length > 0 && (
          <>
            {/* In-stock toggle */}
            {inStockCount > 0 && (
              <button
                onClick={() => setInStockOnly((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition"
                style={
                  inStockOnly
                    ? { background: "linear-gradient(135deg, var(--gold-400), var(--gold-500))", color: "#1a0e00", border: "1px solid var(--gold-500)" }
                    : { background: "rgba(200,155,60,0.08)", color: "var(--gold-600)", border: "1px solid rgba(200,155,60,0.25)" }
                }
              >
                <span>🛒 {inStockCount} available in store</span>
                <span className="opacity-60">{inStockOnly ? "— showing only these" : "— tap to filter"}</span>
              </button>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player, card #, team..."
                className="flex-1 min-w-[200px] rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]"
              />
              <select
                value={filterSet}
                onChange={(e) => setFilterSet(e.target.value)}
                className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All sets ({missing.length})</option>
                {sets.map((s) => (
                  <option key={s} value={s}>
                    {s} ({missing.filter((m) => m.set_title === s).length})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-zinc-500">
              {filtered.length} missing card{filtered.length !== 1 ? "s" : ""} shown
            </p>

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl bg-white p-4"
                  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{card.player_name}</p>
                      <p className="text-[11px] text-zinc-500">
                        #{card.card_number}
                        {card.team ? ` · ${card.team}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {card.inStock && (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "rgba(200,155,60,0.12)", color: "var(--gold-600)", border: "1px solid rgba(200,155,60,0.3)" }}>In store</span>
                      )}
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 border border-red-200">Missing</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">{card.set_title}</span>
                    {card.parallel && card.parallel !== "Base" && (
                      <span
                        className="rounded-full bg-[#fafaf9] px-2 py-0.5 text-[9px] text-zinc-500"
                        style={{ border: "1px solid rgba(0,0,0,0.07)" }}
                      >
                        {card.parallel}
                      </span>
                    )}
                  </div>
                  {card.storeVariants.length > 0 && (
                    <VariantCartButton
                      variants={card.storeVariants}
                      playerName={card.player_name}
                      cardNumber={card.card_number}
                    />
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
