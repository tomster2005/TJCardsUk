"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import getBrowserSupabase from "@/lib/supabase/client";

export default function NewCardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [setName, setSetName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState("draft");
  const [parallel, setParallel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [backImageUrl, setBackImageUrl] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-8 text-zinc-600">Checking auth…</div>;
  }

  async function handleSave() {
    const supabase = getBrowserSupabase();
    if (!supabase) { setSubmitError("Supabase client is not available."); return; }

    setIsSaving(true);
    setSubmitError(null);

    const safeTitle = title.trim();
    const safeSetName = setName.trim();
    const safeCardNumber = cardNumber.trim();
    const safeParallel = parallel.trim() || null;
    const slug = `${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${safeCardNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const payload: any = {
      title: safeTitle,
      player: safeTitle,
      set_name: safeSetName,
      card_number: safeCardNumber,
      price: Number(price),
      stock: Number(stock),
      status: status === "published" ? "published" : "draft",
      slug,
      parallel: safeParallel,
      is_base_variant: !safeParallel,
      image_url: imageUrl.trim() || null,
      back_image_url: backImageUrl.trim() || null,
    };

    // Auto-resolve variant_group_id
    if (safeParallel) {
      const { data: baseCard } = await supabase
        .from("cards")
        .select("id, variant_group_id")
        .eq("card_number", safeCardNumber)
        .eq("set_name", safeSetName)
        .is("parallel", null)
        .limit(1)
        .single();

      if (baseCard) {
        if (!baseCard.variant_group_id) {
          await supabase.from("cards").update({ variant_group_id: baseCard.id }).eq("id", baseCard.id);
        }
        payload.variant_group_id = baseCard.variant_group_id || baseCard.id;
      }
    }

    const { error } = await supabase.from("cards").insert([payload]);

    if (!error) {
      setIsSaving(false);
      router.push("/admin/cards");
      return;
    }

    setSubmitError(error.message || "Unknown error.");
    setIsSaving(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-9 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold text-zinc-900">Add Card</h1>
        <p className="mt-3 text-sm text-zinc-600">Create a new card entry. Leave parallel blank for a base card.</p>

        <form className="mt-6 grid gap-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block">
            <span className="text-sm text-zinc-700">Title / Player</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700">Set</span>
            <input value={setName} onChange={(e) => setSetName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-zinc-700">Card number</span>
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-700">Parallel <span className="text-zinc-400">(leave blank for base)</span></span>
              <input value={parallel} onChange={(e) => setParallel(e.target.value)} placeholder="e.g. Refractor, Diamante..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-zinc-700">Front image URL <span className="text-zinc-400">(paste from Supabase)</span></span>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none font-mono text-xs" />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700">Back image URL <span className="text-zinc-400">(paste from Supabase)</span></span>
            <input value={backImageUrl} onChange={(e) => setBackImageUrl(e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none font-mono text-xs" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-zinc-700">Price (GBP)</span>
              <input value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} type="number" step="0.01" className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-700">Stock</span>
              <input value={stock} onChange={(e) => setStock(Number(e.target.value) || 0)} type="number" className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-zinc-700">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          {submitError && (
            <div className="rounded-2xl border border-red-400/30 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Unable to save card</p>
              <p className="mt-1">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-full border border-amber-400/45 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? "Saving…" : "Save"}
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
