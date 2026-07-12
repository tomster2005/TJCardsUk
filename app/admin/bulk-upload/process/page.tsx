"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import getBrowserSupabase from "@/lib/supabase/client";

interface ImagePair {
  front: string; // full public URL
  back: string;
  frontPath: string; // storage path
  backPath: string;
}

export default function ProcessBatchPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [pairs, setPairs] = useState<ImagePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [setName, setSetName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [status, setStatus] = useState("draft");
  const [team, setTeam] = useState("");
  const [brand, setBrand] = useState("");
  const [season, setSeason] = useState("");
  const [parallel, setParallel] = useState("");
  const [printRun, setPrintRun] = useState("");

  // Load batches (top-level folders in card-images bucket)
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data, error: e } = await supabase.storage.from("card-images").list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
      console.log("STORAGE LIST RESPONSE:", { data, error: e });
      if (e) { setError(e.message); setLoading(false); return; }
      // Include anything that looks like a batch folder (no file extension or placeholder)
      const folders = (data || [])
        .map(f => f.name)
        .filter(name => name && !name.includes(".emptyFolderPlaceholder"));
      console.log("FILTERED FOLDERS:", folders);
      setBatches(folders);
      setLoading(false);
    })();
  }, [supabase]);

  // Load pairs when batch selected
  useEffect(() => {
    if (!supabase || !selectedBatch) return;
    (async () => {
      setLoading(true);
      const { data, error: e } = await supabase.storage.from("card-images").list(selectedBatch, { limit: 500, sortBy: { column: "name", order: "asc" } });
      if (e) { setError(e.message); setLoading(false); return; }

      const files = (data || []).filter(f => f.name.includes(".")).sort((a, b) => a.name.localeCompare(b.name));

      // Group by card number (e.g. "0001") and match _front / _back
      const cardMap: Record<string, { front?: string; back?: string }> = {};
      for (const f of files) {
        const match = f.name.match(/^(\d+)_(front|back)\./i);
        if (!match) continue;
        const num = match[1];
        const side = match[2].toLowerCase();
        if (!cardMap[num]) cardMap[num] = {};
        cardMap[num][side as "front" | "back"] = f.name;
      }

      const newPairs: ImagePair[] = [];
      const sortedNums = Object.keys(cardMap).sort();
      for (const num of sortedNums) {
        const entry = cardMap[num];
        if (!entry.front || !entry.back) continue;
        const frontPath = `${selectedBatch}/${entry.front}`;
        const backPath = `${selectedBatch}/${entry.back}`;
        const { data: frontUrl } = supabase.storage.from("card-images").getPublicUrl(frontPath);
        const { data: backUrl } = supabase.storage.from("card-images").getPublicUrl(backPath);
        newPairs.push({ front: frontUrl.publicUrl, back: backUrl.publicUrl, frontPath, backPath });
      }

      setPairs(newPairs);
      setCurrentIndex(0);
      setLoading(false);
    })();
  }, [supabase, selectedBatch]);

  const currentPair = pairs[currentIndex] || null;

  async function handleSave() {
    if (!supabase || !currentPair) return;
    setSaving(true);
    setError(null);

    const safeTitle = title.trim();
    const safeSet = setName.trim();
    const safeCardNum = cardNumber.trim();

    // Check for duplicate (same title + set + card number)
    const { data: existing } = await supabase
      .from("cards")
      .select("id, stock")
      .eq("title", safeTitle)
      .eq("set_name", safeSet)
      .eq("card_number", safeCardNum)
      .limit(1)
      .single();

    if (existing) {
      // Duplicate found — increment stock
      const { error: updateErr } = await supabase
        .from("cards")
        .update({ stock: existing.stock + (Number(stock) || 1) })
        .eq("id", existing.id);

      if (updateErr) { setError(updateErr.message); setSaving(false); return; }
    } else {
      // New card — insert
      const slug = `${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${safeCardNum.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

      const { error: insertErr } = await supabase.from("cards").insert([{
        title: safeTitle,
        player: safeTitle,
        set_name: safeSet,
        card_number: safeCardNum,
        price: Number(price) || 0,
        stock: Number(stock) || 1,
        status,
        slug,
        image_front: currentPair.front,
        image_back: currentPair.back,
        image_url: currentPair.front,
        back_image_url: currentPair.back,
        team: team.trim() || null,
        brand: brand.trim() || null,
        season: season.trim() || null,
        parallel: parallel.trim() || null,
        print_run: printRun.trim() || null,
      }]);

      if (insertErr) { setError(insertErr.message); setSaving(false); return; }
    }

    // Remember set name for next card

    // Advance to next
    setSaving(false);
    setTitle("");
    setCardNumber("");
    setPrice("");
    setStock("1");
    setPrintRun("");
    // Keep setName, team, brand, season, parallel (persist between cards)

    if (currentIndex + 1 < pairs.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push("/admin/bulk-upload?done=1");
    }
  }

  function handleSkip() {
    if (currentIndex + 1 < pairs.length) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-600">Loading…</div>;
  }

  // Batch selection
  if (!selectedBatch) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-zinc-900">Process Uploaded Cards</h1>
          <p className="mt-2 text-zinc-600">Select a batch to start assigning card details.</p>
        </div>

        {batches.length === 0 ? (
          <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-600">
            No batches found. Upload images first.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map(b => (
              <button key={b} onClick={() => setSelectedBatch(b)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-amber-300 hover:bg-amber-50/30 transition">
                <p className="font-medium text-zinc-900">Batch: {b}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!currentPair) {
    return (
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-600">
        No image pairs found in this batch.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Card {currentIndex + 1} of {pairs.length}</h1>
          <p className="text-sm text-zinc-500">Batch: {selectedBatch}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSkip} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50">Skip</button>
          <button onClick={() => { setSelectedBatch(null); setPairs([]); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50">Back to batches</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image preview */}
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase text-zinc-400">Front</p>
              <img src={currentPair.front} alt="Front" className="aspect-[2/3] w-full rounded-xl object-contain bg-slate-50" />
            </div>
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase text-zinc-400">Back</p>
              <img src={currentPair.back} alt="Back" className="aspect-[2/3] w-full rounded-xl object-contain bg-slate-50 rotate-180" />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm">
          <form className="grid gap-4" onSubmit={e => e.preventDefault()}>
            <label className="block">
              <span className="text-sm text-zinc-700">Player / Title</span>
              <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Set</span>
                <input value={setName} onChange={e => setSetName(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Team</span>
                <input value={team} onChange={e => setTeam(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Brand</span>
                <input value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Season</span>
                <input value={season} onChange={e => setSeason(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Card Number</span>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Parallel</span>
                <input value={parallel} onChange={e => setParallel(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Print Run</span>
                <input value={printRun} onChange={e => setPrintRun(e.target.value)} placeholder="e.g. /99" className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Price (£)</span>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Stock</span>
                <input value={stock} onChange={e => setStock(e.target.value)} type="number" className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Status</span>
                <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            <button type="button" onClick={handleSave} disabled={saving || !title.trim()} className="mt-2 w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50">
              {saving ? "Saving…" : "Save & Next"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
