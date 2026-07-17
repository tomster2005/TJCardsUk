"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import getBrowserSupabase from "@/lib/supabase/client";

type EditableCard = {
  id: string;
  title: string;
  player: string;
  set_name: string;
  card_number: string;
  price: number;
  stock: number;
  status: string;
  parallel: string;
  image_url: string;
  back_image_url: string;
};

export default function EditCardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [card, setCard] = useState<EditableCard | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const id = params?.id;
    const supabase = getBrowserSupabase();
    if (!id || !supabase || loading || !user) return;

    let mounted = true;

    (async () => {
      const { data, error } = await supabase.from("cards").select("*").eq("id", id).limit(1).single();
      if (!mounted) return;

      if (error || !data) {
        setSubmitError(error?.message || "Unable to load card.");
        setIsLoadingCard(false);
        return;
      }

      setCard({
        id: data.id,
        title: data.title ?? "",
        player: data.player ?? data.title ?? "",
        set_name: data.set_name ?? "",
        card_number: data.card_number ?? "",
        price: Number(data.price ?? 0),
        stock: Number(data.stock ?? 0),
        status: data.status ?? "draft",
        parallel: data.parallel ?? "",
        image_url: data.image_url ?? "",
        back_image_url: data.back_image_url ?? "",
      });
      setIsLoadingCard(false);
    })();

    return () => {
      mounted = false;
    };
  }, [params, loading, user]);

  if (loading || !user) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-8 text-zinc-600">Checking auth…</div>;
  }

  if (isLoadingCard) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-8 text-zinc-600">Loading card…</div>;
  }

  if (!card) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        {submitError || "Card not found."}
      </div>
    );
  }

  const activeCard = card;

  async function handleSave() {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setSubmitError("Supabase client is not available.");
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    const payload: any = {
      title: activeCard.title.trim(),
      player: activeCard.player.trim() || activeCard.title.trim(),
      set_name: activeCard.set_name.trim(),
      card_number: activeCard.card_number.trim(),
      price: Number(activeCard.price),
      stock: Number(activeCard.stock),
      status: activeCard.status === "published" ? "published" : "draft",
      parallel: activeCard.parallel.trim() || null,
      image_url: activeCard.image_url.trim() || null,
      image_front: activeCard.image_url.trim() || null,
      back_image_url: activeCard.back_image_url.trim() || null,
      image_back: activeCard.back_image_url.trim() || null,
      is_base_variant: !activeCard.parallel.trim(),
    };

    const isVariant = Boolean(activeCard.parallel.trim());

    if (isVariant) {
      const { data: baseCard } = await supabase
        .from("cards")
        .select("id, variant_group_id")
        .eq("card_number", activeCard.card_number.trim())
        .eq("set_name", activeCard.set_name.trim())
        .is("parallel", null)
        .limit(1)
        .single();

      if (baseCard) {
        if (!baseCard.variant_group_id) {
          await supabase.from("cards").update({ variant_group_id: baseCard.id }).eq("id", baseCard.id);
        }
        payload.variant_group_id = baseCard.variant_group_id || baseCard.id;
      }
    } else {
      payload.variant_group_id = activeCard.id;
    }

    const { error } = await supabase.from("cards").update(payload).eq("id", activeCard.id);

    if (error) {
      setSubmitError(error.message || "Unable to update card.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.push("/admin/cards");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-9 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold text-zinc-900">Edit Card</h1>
        <p className="mt-3 text-sm text-zinc-600">Update card details, stock, and publish status.</p>

        <form className="mt-6 grid gap-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block">
            <span className="text-sm text-zinc-700">Title</span>
            <input value={card.title} onChange={(e) => setCard((cur) => (cur ? { ...cur, title: e.target.value } : cur))} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700">Player</span>
            <input value={card.player} onChange={(e) => setCard((cur) => (cur ? { ...cur, player: e.target.value } : cur))} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700">Set</span>
            <input value={card.set_name} onChange={(e) => setCard((cur) => (cur ? { ...cur, set_name: e.target.value } : cur))} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-zinc-700">Card number</span>
              <input value={card.card_number} onChange={(e) => setCard((cur) => (cur ? { ...cur, card_number: e.target.value } : cur))} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-700">Price (GBP)</span>
              <input value={card.price} onChange={(e) => setCard((cur) => (cur ? { ...cur, price: Number(e.target.value) || 0 } : cur))} type="number" className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-zinc-700">Stock</span>
              <input value={card.stock} onChange={(e) => setCard((cur) => (cur ? { ...cur, stock: Number(e.target.value) || 0 } : cur))} type="number" className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-700">Status</span>
              <select value={card.status} onChange={(e) => setCard((cur) => (cur ? { ...cur, status: e.target.value } : cur))} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-zinc-700">Parallel</span>
              <input value={card.parallel} onChange={(e) => setCard((cur) => (cur ? { ...cur, parallel: e.target.value } : cur))} placeholder="e.g. Refractor, Prizm..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-zinc-700">Front image URL</span>
            <input value={card.image_url} onChange={(e) => setCard((cur) => (cur ? { ...cur, image_url: e.target.value } : cur))} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none font-mono text-xs" />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700">Back image URL</span>
            <input value={card.back_image_url} onChange={(e) => setCard((cur) => (cur ? { ...cur, back_image_url: e.target.value } : cur))} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none font-mono text-xs" />
          </label>

          <p className="text-xs text-zinc-400">Cards with no parallel show in the catalogue. Cards with a parallel are variants.</p>

          {submitError ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              <p className="font-medium">Unable to save card</p>
              <p className="mt-1">{submitError}</p>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-full border border-amber-400/45 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={() => router.push("/admin/cards")} className="rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm text-zinc-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}