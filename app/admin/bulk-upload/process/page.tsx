"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import getBrowserSupabase from "@/lib/supabase/client";
import { createWorker, Worker } from "tesseract.js";

interface ImagePair {
  front: string;
  back: string;
  frontPath: string;
  backPath: string;
}

interface ChecklistEntry {
  card_number: string;
  player_name: string;
}

interface BinderSet {
  id: string;
  title: string;
}

const STORAGE_KEY = "bulk-upload-progress";

function loadProgress(): { batch: string | null; index: number; binderId: string | null } {
  if (typeof window === "undefined") return { batch: null, index: 0, binderId: null };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { batch: null, index: 0, binderId: null };
}

function saveProgress(batch: string | null, index: number, binderId: string | null) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ batch, index, binderId })); } catch {}
}

function clearProgress() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

// Simple fuzzy match: Levenshtein distance
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(ocrText: string, checklist: ChecklistEntry[]): ChecklistEntry | null {
  if (!ocrText || checklist.length === 0) return null;
  const cleaned = ocrText.replace(/[^a-zA-Z\s]/g, "").trim().toLowerCase();
  if (cleaned.length < 2) return null;

  let best: ChecklistEntry | null = null;
  let bestScore = Infinity;

  for (const entry of checklist) {
    const name = entry.player_name.toLowerCase();
    const dist = levenshtein(cleaned, name);
    // Normalize by the longer string length
    const maxLen = Math.max(cleaned.length, name.length);
    const score = dist / maxLen;
    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Only accept if similarity is > 50% (score < 0.5)
  return bestScore < 0.5 ? best : null;
}

function ChecklistPicker({ checklist, onSelect }: { checklist: ChecklistEntry[]; onSelect: (entry: ChecklistEntry) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.length >= 2
    ? checklist.filter(e => e.player_name.toLowerCase().includes(query.toLowerCase()) || e.card_number.includes(query)).slice(0, 8)
    : [];

  return (
    <div className="relative mt-1">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search checklist..."
        className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-zinc-700 outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(entry => (
            <button
              key={entry.card_number}
              onClick={() => { onSelect(entry); setQuery(""); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50 flex justify-between"
            >
              <span className="text-zinc-900">{entry.player_name}</span>
              <span className="text-zinc-400">#{entry.card_number}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  const [scanning, setScanning] = useState(false);
  const [ocrWorker, setOcrWorker] = useState<Worker | null>(null);

  // Binder checklist
  const [binderSets, setBinderSets] = useState<BinderSet[]>([]);
  const [selectedBinder, setSelectedBinder] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistEntry[]>([]);
  const [ocrRawText, setOcrRawText] = useState("");
  const [matchConfidence, setMatchConfidence] = useState("");

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

  // Restore progress
  useEffect(() => {
    const saved = loadProgress();
    if (saved.batch) {
      setSelectedBatch(saved.batch);
      setCurrentIndex(saved.index);
    }
    if (saved.binderId) setSelectedBinder(saved.binderId);
  }, []);

  useEffect(() => {
    if (selectedBatch) saveProgress(selectedBatch, currentIndex, selectedBinder);
  }, [selectedBatch, currentIndex, selectedBinder]);

  // Load binder sets
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.from("binder_sets").select("id, title");
      setBinderSets(data || []);
    })();
  }, [supabase]);

  // Load checklist when binder selected
  useEffect(() => {
    if (!supabase || !selectedBinder) return;
    (async () => {
      const { data } = await supabase
        .from("binder_checklist")
        .select("card_number, player_name")
        .eq("set_id", selectedBinder);
      setChecklist(data || []);
      // Also set the set name from the binder title
      const binder = binderSets.find(b => b.id === selectedBinder);
      if (binder) setSetName(binder.title);
    })();
  }, [supabase, selectedBinder, binderSets]);

  // Init OCR worker
  useEffect(() => {
    let worker: Worker | null = null;
    (async () => {
      worker = await createWorker("eng");
      setOcrWorker(worker);
    })();
    return () => { worker?.terminate(); };
  }, []);

  // Crop center-bottom strip of front image (where name text sits)
  const cropImage = useCallback((imageUrl: string, pct: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const cropHeight = Math.round(img.height * pct);
        const sy = img.height - cropHeight;
        // Crop middle 70% width to avoid edge gradients
        const marginX = Math.round(img.width * 0.15);
        const cropWidth = img.width - marginX * 2;
        const scale = Math.max(2, 1200 / cropWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(cropWidth * scale);
        canvas.height = Math.round(cropHeight * scale);
        const ctx = canvas.getContext("2d")!;
        // White background to help OCR with contrast
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, marginX, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }, []);

  const runOCR = useCallback(async (frontUrl: string) => {
    if (!ocrWorker) return;
    setScanning(true);
    setOcrRawText("");
    setMatchConfidence("");
    try {
      // Read bottom 12% of front image for the name
      const frontCrop = await cropImage(frontUrl, 0.12);
      const { data: { text } } = await ocrWorker.recognize(frontCrop);
      console.log("OCR raw:", text);

      // Clean: find the best text fragment that looks like a name
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);
      // Strip non-letter chars and find longest clean word sequence
      const allText = lines.join(" ");
      const cleaned = allText.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ").trim();
      // Get the longest word or phrase (split by multiple spaces that were symbols)
      const fragments = cleaned.split(/\s+/).filter(w => w.length > 2);
      const bestLine = fragments.join(" ") || "";
      console.log("OCR cleaned:", bestLine);
      setOcrRawText(bestLine);

      // Fuzzy match against checklist
      if (checklist.length > 0 && bestLine) {
        const match = fuzzyMatch(bestLine, checklist);
        if (match) {
          setTitle(match.player_name);
          setCardNumber(match.card_number);
          setMatchConfidence("Matched from checklist");
        } else {
          // No good match, just use OCR text cleaned up
          const cleaned = bestLine.replace(/[^a-zA-Z\s'-]/g, "").trim();
          if (cleaned && !title) setTitle(cleaned);
          setMatchConfidence("No checklist match - using OCR");
        }
      } else if (bestLine) {
        const cleaned = bestLine.replace(/[^a-zA-Z\s'-]/g, "").trim();
        if (cleaned && !title) setTitle(cleaned);
        setMatchConfidence("No checklist loaded");
      }
    } catch (e) {
      console.error("OCR error:", e);
    }
    setScanning(false);
  }, [ocrWorker, checklist, title, cropImage]);

  // Auto-scan when new card loads
  useEffect(() => {
    const pair = pairs[currentIndex];
    if (pair && ocrWorker && !title && !cardNumber) {
      runOCR(pair.front);
    }
  }, [currentIndex, pairs, ocrWorker]);

  // Load batches
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data, error: e } = await supabase.storage.from("card-images").list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
      if (e) { setError(e.message); setLoading(false); return; }
      const folders = (data || [])
        .map(f => f.name)
        .filter(name => name && !name.includes(".emptyFolderPlaceholder"));
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
      for (const num of Object.keys(cardMap).sort()) {
        const entry = cardMap[num];
        if (!entry.front || !entry.back) continue;
        const frontPath = `${selectedBatch}/${entry.front}`;
        const backPath = `${selectedBatch}/${entry.back}`;
        const { data: frontUrl } = supabase.storage.from("card-images").getPublicUrl(frontPath);
        const { data: backUrl } = supabase.storage.from("card-images").getPublicUrl(backPath);
        newPairs.push({ front: frontUrl.publicUrl, back: backUrl.publicUrl, frontPath, backPath });
      }

      setPairs(newPairs);
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

    const { data: existing } = await supabase
      .from("cards")
      .select("id, stock")
      .eq("title", safeTitle)
      .eq("set_name", safeSet)
      .eq("card_number", safeCardNum)
      .limit(1)
      .single();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("cards")
        .update({ stock: existing.stock + (Number(stock) || 1) })
        .eq("id", existing.id);
      if (updateErr) { setError(updateErr.message); setSaving(false); return; }
    } else {
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

    setSaving(false);
    setTitle("");
    setCardNumber("");
    setPrice("");
    setStock("1");
    setPrintRun("");
    setOcrRawText("");
    setMatchConfidence("");

    if (currentIndex + 1 < pairs.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      clearProgress();
      router.push("/admin/bulk-upload?done=1");
    }
  }

  function handleSkip() {
    setTitle("");
    setCardNumber("");
    setOcrRawText("");
    setMatchConfidence("");
    if (currentIndex + 1 < pairs.length) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-600">Loading...</div>;
  }

  // Batch + binder selection
  if (!selectedBatch) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-zinc-900">Process Uploaded Cards</h1>
          <p className="mt-2 text-zinc-600">Select a batch and binder set to start.</p>
        </div>

        {/* Binder selection */}
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Match against binder checklist (optional)</span>
            <select
              value={selectedBinder || ""}
              onChange={e => setSelectedBinder(e.target.value || null)}
              className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none"
            >
              <option value="">None - manual entry only</option>
              {binderSets.map(b => (
                <option key={b.id} value={b.id}>{b.title} </option>
              ))}
            </select>
          </label>
          {selectedBinder && checklist.length > 0 && (
            <p className="mt-2 text-xs text-emerald-600 font-medium">{checklist.length} entries loaded from checklist</p>
          )}
        </div>

        {batches.length === 0 ? (
          <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-600">No batches found. Upload images first.</div>
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
    return <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-600">No image pairs found in this batch.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Card {currentIndex + 1} of {pairs.length}</h1>
          <p className="text-sm text-zinc-500">Batch: {selectedBatch} {selectedBinder && `| Checklist: ${binderSets.find(b => b.id === selectedBinder)?.title}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSkip} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50">Skip</button>
          <button onClick={() => { setSelectedBatch(null); setPairs([]); clearProgress(); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50">Back</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {scanning && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Scanning &amp; matching...
        </div>
      )}

      {matchConfidence && !scanning && (
        <div className={`rounded-2xl border p-3 text-sm flex items-center justify-between ${matchConfidence.includes("Matched") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          <span>{matchConfidence}</span>
          {ocrRawText && <span className="text-xs opacity-60">OCR read: &quot;{ocrRawText}&quot;</span>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase text-zinc-400">Front</p>
              <img src={currentPair.front} alt="Front" className="w-full rounded-xl object-contain bg-slate-50" />
            </div>
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase text-zinc-400">Back</p>
              <img src={currentPair.back} alt="Back" className="w-full rounded-xl object-contain bg-slate-50 rotate-180" />
            </div>
          </div>
          <button
            onClick={() => { setTitle(""); setCardNumber(""); runOCR(currentPair.front); }}
            disabled={scanning}
            className="mt-4 w-full rounded-full border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Re-scan with OCR"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm">
          <form className="grid gap-4" onSubmit={e => e.preventDefault()}>
            <label className="block">
              <span className="text-sm text-zinc-700">Player / Title</span>
              <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              {checklist.length > 0 && (
                <ChecklistPicker checklist={checklist} onSelect={(entry) => { setTitle(entry.player_name); setCardNumber(entry.card_number); }} />
              )}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Card Number</span>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Set</span>
                <input value={setName} onChange={e => setSetName(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-zinc-700">Team</span>
                <input value={team} onChange={e => setTeam(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-700">Parallel</span>
                <input value={parallel} onChange={e => setParallel(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
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
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm text-zinc-700">Price</span>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
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
              {saving ? "Saving..." : "Save & Next"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
