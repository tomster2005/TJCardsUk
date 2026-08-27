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

interface ChecklistSlot {
  id: string;
  card_number: string;
  player_name: string;
  position: number;
  hasImage: boolean;
}

interface BinderSet {
  id: string;
  title: string;
}

const STORAGE_KEY = "bulk-upload-progress";
const FIELDS_KEY = "bulk-upload-fields";
const BAG_KEY = "bulk-upload-bag";
const BAG_COUNT_KEY = "bulk-upload-bag-count";
const BAG_SUFFIX_KEY = "bulk-upload-bag-suffix";
const BAG_CAPACITY = 30;

// Increment letter suffix: AAA → AAB → AAZ → ABA → ... → ZZZ
function nextSuffix(suffix: string): string {
  const chars = suffix.toUpperCase().split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] < "Z") { chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1); return chars.join(""); }
    chars[i] = "A";
  }
  return "A".repeat(chars.length + 1);
}

function parseBag(bag: string): { num: number; suffix: string } | null {
  const m = bag.match(/^(\d+)([A-Z]+)$/i);
  if (!m) return null;
  return { num: parseInt(m[1], 10), suffix: m[2].toUpperCase() };
}

function nextBagInSet(current: string): string {
  const p = parseBag(current);
  return p ? `${p.num + 1}${p.suffix}` : current;
}

function loadProgress(): { batch: string | null; index: number; binderId: string | null; owner: string | null; category: string | null } {
  if (typeof window === "undefined") return { batch: null, index: 0, binderId: null, owner: null, category: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { batch: null, index: 0, binderId: null, owner: null, category: null };
}

function saveProgress(batch: string | null, index: number, binderId: string | null, owner: string | null, category: string | null) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ batch, index, binderId, owner, category })); } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(FIELDS_KEY); } catch {}
}

type FieldState = { title: string; cardNumber: string; setName: string; price: string; stock: string; status: string; team: string; brand: string; season: string; parallel: string; printRun: string; locked: Record<string, boolean> };

function loadFields(): FieldState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FIELDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveFields(fields: FieldState) {
  try { localStorage.setItem(FIELDS_KEY, JSON.stringify(fields)); } catch {}
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
          {filtered.map((entry, i) => (
            <button
              key={`${entry.card_number}-${entry.player_name}-${i}`}
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
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  function toggleLock(field: string) {
    setLocked(prev => ({ ...prev, [field]: !prev[field] }));
  }

  function clearUnlocked() {
    if (!locked.setName) setSetName("");
    if (!locked.team) setTeam("");
    if (!locked.brand) setBrand("");
    if (!locked.season) setSeason("");
    if (!locked.parallel) setParallel("");
    if (!locked.printRun) setPrintRun("");
    if (!locked.price) setPrice("");
    if (!locked.stock) setStock("1");
    if (!locked.status) setStatus("draft");
  }
  const [binderImageMode, setBinderImageMode] = useState(false);
  const [owner, setOwner] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [binderSlots, setBinderSlots] = useState<ChecklistSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Bag / storage location
  const [currentBag, setCurrentBag] = useState<string>(() => {
    try { return localStorage.getItem(BAG_KEY) || ""; } catch { return ""; }
  });
  const [bagCount, setBagCount] = useState<number>(0);
  const [currentSuffix, setCurrentSuffix] = useState<string>(() => {
    try { return localStorage.getItem(BAG_SUFFIX_KEY) ?? "AAA"; } catch { return "AAA"; }
  });
  const [bagOverride, setBagOverride] = useState("");
  const [showBagPrompt, setShowBagPrompt] = useState(false);
  const [bagChangedTo, setBagChangedTo] = useState<string | null>(null); // non-null = show bag-change modal
  const [bagStatus, setBagStatus] = useState<string | null>(null);
  const [bagStatusLoading, setBagStatusLoading] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(BAG_KEY, currentBag); } catch {}
  }, [currentBag]);
  useEffect(() => {
    try { localStorage.setItem(BAG_SUFFIX_KEY, currentSuffix); } catch {}
  }, [currentSuffix]);

  // Restore state on mount — batch/index only restored on Resume click, not automatically
  useEffect(() => {
    const saved = loadProgress();
    if (saved.binderId) setSelectedBinder(saved.binderId);
    if (saved.owner) setOwner(saved.owner);
    if (saved.category) setCategory(saved.category);
    const f = loadFields();
    if (f) {
      setTitle(f.title);
      setCardNumber(f.cardNumber);
      setSetName(f.setName);
      setPrice(f.price);
      setStock(f.stock);
      setStatus(f.status);
      setTeam(f.team);
      setBrand(f.brand);
      setSeason(f.season);
      setParallel(f.parallel);
      setPrintRun(f.printRun);
      setLocked(f.locked);
    }
  }, []);

  // Persist fields whenever they change
  useEffect(() => {
    saveFields({ title, cardNumber, setName, price, stock, status, team, brand, season, parallel, printRun, locked });
  }, [title, cardNumber, setName, price, stock, status, team, brand, season, parallel, printRun, locked]);

  useEffect(() => {
    if (selectedBatch) saveProgress(selectedBatch, currentIndex, selectedBinder, owner, category);
  }, [selectedBatch, currentIndex, selectedBinder, owner, category]);

  // Load binder slots when card number changes
  useEffect(() => {
    if (!supabase || !selectedBinder || !cardNumber.trim()) { setBinderSlots([]); setSelectedSlotId(null); return; }
    (async () => {
      const { data: slots } = await supabase
        .from("binder_checklist")
        .select("id, card_number, player_name, position")
        .eq("set_id", selectedBinder)
        .eq("card_number", cardNumber.trim())
        .order("position", { ascending: true });
      if (!slots || slots.length <= 1) { setBinderSlots([]); setSelectedSlotId(null); return; }
      const ids = slots.map((s: any) => s.id);
      const { data: images } = await supabase.from("community_images").select("checklist_id").in("checklist_id", ids);
      const withImages = new Set((images ?? []).map((i: any) => i.checklist_id));
      const mapped: ChecklistSlot[] = slots.map((s: any) => ({ ...s, hasImage: withImages.has(s.id) }));
      setBinderSlots(mapped);
      const empty = mapped.find(s => !s.hasImage);
      setSelectedSlotId(empty?.id ?? mapped[0].id);
    })();
  }, [supabase, selectedBinder, cardNumber]);

  // On mount, fetch live count for the current bag from Supabase
  useEffect(() => {
    if (!supabase || !currentBag) return;
    (async () => {
      setBagStatusLoading(true);
      const { count } = await supabase
        .from("card_copies")
        .select("*", { count: "exact", head: true })
        .eq("storage_location", currentBag)
        .eq("sold", false);
      const liveCount = count ?? 0;
      setBagCount(liveCount);
      if (liveCount >= BAG_CAPACITY) {
        // Bag already full — find next available bag for this suffix
        const parsed = parseBag(currentBag);
        if (parsed) {
          let allData: any[] = [];
          let from = 0;
          while (true) {
            const { data, error } = await supabase
              .from("card_copies")
              .select("storage_location, sold")
              .like("storage_location", `%${parsed.suffix}`)
              .range(from, from + 999);
            if (error || !data || data.length === 0) break;
            allData = allData.concat(data);
            if (data.length < 1000) break;
            from += 1000;
          }
          const { data: sealedData } = await supabase.from("full_bags").select("location");
          const sealed = new Set((sealedData ?? []).map((r: any) => r.location));
          const bagMap: Record<string, number> = {};
          for (const row of allData) {
            const loc = row.storage_location as string;
            if (sealed.has(loc)) continue;
            if (!row.sold) bagMap[loc] = (bagMap[loc] ?? 0) + 1;
            else if (!(loc in bagMap)) bagMap[loc] = 0;
          }
          const sorted = Object.entries(bagMap).sort((a, b) => (parseBag(a[0])?.num ?? 0) - (parseBag(b[0])?.num ?? 0));
          const available = sorted.find(([bag, cnt]) => bag !== currentBag && cnt < BAG_CAPACITY);
          if (available) {
            setCurrentBag(available[0]);
            setBagCount(available[1]);
            setBagChangedTo(available[0]);
          } else {
            const maxNum = Math.max(...sorted.map(([bag]) => parseBag(bag)?.num ?? 0));
            const newBag = `${maxNum + 1}${parsed.suffix}`;
            setCurrentBag(newBag);
            setBagCount(0);
            setShowBagPrompt(true);
          }
        }
      }
      setBagStatusLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // and find the best bag to resume (backfill: lowest-numbered bag with space first)
  useEffect(() => {
    if (!supabase || !currentSuffix) return;
    setBagStatusLoading(true);
    (async () => {
      let allData: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("card_copies")
          .select("storage_location, sold")
          .like("storage_location", `%${currentSuffix}`)
          .range(from, from + 999);
        if (error || !data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < 1000) break;
        from += 1000;
      }

      if (allData.length === 0) {
        // No existing bags for this suffix — start fresh at 1
        const firstBag = `1${currentSuffix}`;
        setCurrentBag(firstBag);
        setBagCount(0);
        setBagStatus(`No existing bags — starting ${firstBag}`);
        setBagStatusLoading(false);
        return;
      }

      // Group unsold counts per bag, excluding sealed bags
          const { data: sealedData } = await supabase.from("full_bags").select("location");
          const sealed = new Set((sealedData ?? []).map((r: any) => r.location));
          const bagMap: Record<string, number> = {};
          for (const row of allData) {
            const loc = row.storage_location as string;
            if (sealed.has(loc)) continue;
            if (!row.sold) bagMap[loc] = (bagMap[loc] ?? 0) + 1;
            else if (!(loc in bagMap)) bagMap[loc] = 0;
          }

      // Sort bags by number ascending (backfill: lowest first)
      const sorted = Object.entries(bagMap).sort((a, b) => {
        const pa = parseBag(a[0]), pb = parseBag(b[0]);
        return (pa?.num ?? 0) - (pb?.num ?? 0);
      });

      // Find first bag with space
      const available = sorted.find(([, count]) => count < BAG_CAPACITY);
      if (available) {
        setCurrentBag(available[0]);
        setBagCount(available[1]);
        setBagStatus(`Resuming ${available[0]} (${available[1]}/${BAG_CAPACITY} used)`);
      } else {
        // All full — start next bag after the highest
        const maxNum = Math.max(...sorted.map(([bag]) => parseBag(bag)?.num ?? 0));
        const newBag = `${maxNum + 1}${currentSuffix}`;
        setCurrentBag(newBag);
        setBagCount(0);
        setBagStatus(`All bags full — starting ${newBag}`);
      }
      setBagStatusLoading(false);
    })();
  }, [supabase, currentSuffix]);

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
      const binder = binderSets.find(b => b.id === selectedBinder);
      if (binder) {
        setSetName(binder.title);
        // Auto-detect bag suffix and best bag for this set
        setBagStatusLoading(true);
        const { data: copies } = await supabase
          .from("card_copies")
          .select("storage_location")
          .eq("sold", false)
          .not("storage_location", "is", null)
          .limit(1000);

        // Find suffix used by this set
        const { data: setCopies } = await supabase
          .from("card_copies")
          .select("storage_location, cards(set_name)")
          .not("storage_location", "is", null)
          .limit(1);
        // Use a direct join query to find suffix for this set
        const { data: locRows } = await supabase
          .from("card_copies")
          .select("storage_location")
          .eq("sold", false)
          .not("storage_location", "is", null)
          .filter("cards.set_name", "eq", binder.title)
          .limit(1);

        // Better: query via cards join
        const { data: joinRows } = await supabase
          .from("card_copies")
          .select("storage_location, cards!inner(set_name)")
          .eq("cards.set_name", binder.title)
          .not("storage_location", "is", null)
          .eq("sold", false)
          .order("created_at", { ascending: false })
          .limit(1);

        const detectedLoc = joinRows?.[0]?.storage_location as string | undefined;
        const detectedSuffix = detectedLoc ? parseBag(detectedLoc)?.suffix : null;
        const suffix = detectedSuffix ?? currentSuffix;

        if (detectedSuffix && detectedSuffix !== currentSuffix) {
          setCurrentSuffix(detectedSuffix);
        }

        // Now find best bag for this suffix
        let allData: any[] = [];
        let from = 0;
        while (true) {
          const { data, error } = await supabase
            .from("card_copies")
            .select("storage_location, sold")
            .like("storage_location", `%${suffix}`)
            .range(from, from + 999);
          if (error || !data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < 1000) break;
          from += 1000;
        }

        if (allData.length === 0) {
          const firstBag = `1${suffix}`;
          setCurrentBag(firstBag);
          setBagCount(0);
          setBagStatus(`No existing bags — starting ${firstBag}`);
        } else {
          const bagMap: Record<string, number> = {};
          for (const row of allData) {
            const loc = row.storage_location as string;
            if (!row.sold) bagMap[loc] = (bagMap[loc] ?? 0) + 1;
            else if (!(loc in bagMap)) bagMap[loc] = 0;
          }
          const sorted = Object.entries(bagMap).sort((a, b) => (parseBag(a[0])?.num ?? 0) - (parseBag(b[0])?.num ?? 0));
          // Use highest-numbered bag with space (most recent first)
          const withSpace = sorted.filter(([, cnt]) => cnt < BAG_CAPACITY);
          const best = withSpace[withSpace.length - 1]; // highest bag with space
          if (best) {
            setCurrentBag(best[0]);
            setBagCount(best[1]);
            setBagStatus(`Resuming ${best[0]} (${best[1]}/${BAG_CAPACITY} used)`);
          } else {
            const maxNum = Math.max(...sorted.map(([bag]) => parseBag(bag)?.num ?? 0));
            const newBag = `${maxNum + 1}${suffix}`;
            setCurrentBag(newBag);
            setBagCount(0);
            setBagStatus(`All bags full — starting ${newBag}`);
          }
        }
        setBagStatusLoading(false);
      }
    })();
  }, [supabase, selectedBinder, binderSets]);

  // Init OCR worker
  useEffect(() => {
    let worker: Worker | null = null;
    (async () => {
      worker = await createWorker("eng");
      setOcrWorker(worker);
    })();
    return () => { worker?.terminate().catch(() => {}); };
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
      const ocrCleaned = bestLine.replace(/[^a-zA-Z\s'-]/g, "").trim();
      if (checklist.length > 0 && bestLine) {
        const match = fuzzyMatch(bestLine, checklist);
        if (match) {
          setTitle(match.player_name);
          setCardNumber(match.card_number);
          setMatchConfidence("Matched from checklist");
        } else {
          if (ocrCleaned && !title) setTitle(ocrCleaned);
          setMatchConfidence("No checklist match - using OCR");
        }
      } else if (bestLine) {
        if (ocrCleaned && !title) setTitle(ocrCleaned);
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
      runOCR(pair.front).catch(() => {});
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
        .filter(name => name && !name.includes(".emptyFolderPlaceholder"))
        .sort((a, b) => {
          const na = parseInt(a, 10);
          const nb = parseInt(b, 10);
          const aIsNum = !isNaN(na);
          const bIsNum = !isNaN(nb);
          if (aIsNum && bIsNum) return nb - na; // numeric: descending
          if (aIsNum) return -1; // numeric before alpha
          if (bIsNum) return 1;
          return b.localeCompare(a); // both alpha: descending
        });
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

  function advanceCard() {
    setTitle("");
    setCardNumber("");
    clearUnlocked();
    setOcrRawText("");
    setMatchConfidence("");
    setBinderSlots([]);
    setSelectedSlotId(null);
    setBagOverride("");
    if (currentIndex + 1 < pairs.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      clearProgress();
      router.push("/admin/bulk-upload?done=1");
    }
  }

  const currentPair = pairs[currentIndex] || null;

  async function handleSave() {
    if (!supabase || !currentPair) return;
    const effectiveBag = bagOverride.trim() || currentBag;
    if (!effectiveBag) {
      setError("No bag assigned — wait for bag assignment to load or enter a bag override.");
      return;
    }
    setSaving(true);
    setError(null);

    const safeCardNum = cardNumber.trim();
    const safeTitle = title.trim();
    const safeSet = setName.trim();

    // ── Binder image mode: write directly to community_images as approved ──
    if (binderImageMode) {
      if (!selectedBinder || !safeCardNum) {
        setError("Select a binder and make sure card number is filled in.");
        setSaving(false);
        return;
      }
      // Find the checklist row — prefer base (no parallel) slot
      const { data: clRows } = await supabase
        .from("binder_checklist")
        .select("id, parallel")
        .eq("set_id", selectedBinder)
        .eq("card_number", safeCardNum)
        .order("position", { ascending: true });

      // Prefer the slot with no parallel; fall back to first
      const clId = (clRows?.find((r: any) => !r.parallel || r.parallel.trim() === "") ?? clRows?.[0])?.id ?? null;

      if (!clId) {
        setError(`No checklist entry found for card #${safeCardNum} in this binder.`);
        setSaving(false);
        return;
      }

      // Upsert into community_images as approved — base locks out parallels
      const isBaseUpload = !parallel.trim();
      const { data: existingBase } = await supabase
        .from("community_images")
        .select("id")
        .eq("checklist_id", clId)
        .is("parallel", null)
        .eq("status", "approved")
        .limit(1)
        .single();
      if (isBaseUpload) {
        await supabase.from("community_images").delete().eq("checklist_id", clId);
        const { error: imgErr } = await supabase
          .from("community_images")
          .insert({ checklist_id: clId, image_url: currentPair.front, username: "Admin", status: "approved", uploaded_by: null, parallel: null });
        if (imgErr) { setError(imgErr.message); setSaving(false); return; }
      } else if (!existingBase) {
        await supabase.from("community_images").delete().eq("checklist_id", clId).eq("parallel", parallel.trim());
        const { error: imgErr } = await supabase
          .from("community_images")
          .insert({ checklist_id: clId, image_url: currentPair.front, username: "Admin", status: "approved", uploaded_by: null, parallel: parallel.trim() });
        if (imgErr) { setError(imgErr.message); setSaving(false); return; }
      }

      setSaving(false);
      setTitle(""); setCardNumber(""); setOcrRawText(""); setMatchConfidence("");
      clearUnlocked();
      setBagOverride("");
      const newCount = bagCount + 1;
      setBagCount(newCount);
      if (newCount >= BAG_CAPACITY) {
        setShowBagPrompt(true);
      } else {
        advanceCard();
      }
      return;
    }


    // ── Normal mode: create/update cards row ──

    const parallelValue = parallel.trim() || null;
    let existingQuery = supabase
      .from("cards")
      .select("id, stock, variant_group_id, parallel")
      .eq("title", safeTitle)
      .eq("set_name", safeSet)
      .eq("card_number", safeCardNum);
    existingQuery = parallelValue
      ? existingQuery.eq("parallel", parallelValue)
      : existingQuery.is("parallel", null);
    const { data: existing } = await existingQuery.limit(1).single();

    if (existing) {
      // Add a new copy row for this owner (FIFO tracking)
      const { error: copyErr } = await supabase
        .from("card_copies")
        .insert({ card_id: existing.id, owner: owner || "Joint", sold: false, storage_location: effectiveBag });
      if (copyErr) { setError(copyErr.message); setSaving(false); return; }
      // Increment stock on the card row
      const { error: updateErr } = await supabase
        .from("cards")
        .update({ stock: existing.stock + (Number(stock) || 1) })
        .eq("id", existing.id);
      if (updateErr) { setError(updateErr.message); setSaving(false); return; }
    } else {
      // Find any existing card with same card_number + set_name to get/create variant_group_id
      const { data: sibling } = await supabase
        .from("cards")
        .select("id, variant_group_id")
        .eq("set_name", safeSet)
        .eq("card_number", safeCardNum)
        .limit(1)
        .single();

      let groupId: string | null = sibling?.variant_group_id ?? null;

      // If sibling exists but has no group id yet, create one and assign it to the sibling too
      if (sibling && !groupId) {
        groupId = crypto.randomUUID();
        await supabase.from("cards").update({ variant_group_id: groupId, is_base_variant: true }).eq("id", sibling.id);
      }

      const isBase = !parallel.trim();
      const slug = `${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${safeCardNum.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      const { data: newCard, error: insertErr } = await supabase.from("cards").insert([{
        title: safeTitle,
        player: safeTitle,
        set_name: safeSet,
        card_number: safeCardNum,
        price: Number(price) || 0,
        stock: Number(stock) || 1,
        status,
        slug,
        owner: owner || null,
        category: category || null,
        image_url: currentPair.front,
        back_image_url: currentPair.back,
        team: team.trim() || null,
        brand: brand.trim() || null,
        season: season.trim() || null,
        parallel: parallelValue,
        print_run: printRun.trim() || null,
        variant_group_id: groupId,
        is_base_variant: isBase,
      }]).select("id").single();
      if (insertErr) { setError(insertErr.message); setSaving(false); return; }
      // Insert copy rows for each unit of stock
      const qty = Number(stock) || 1;
      const copyRows = Array.from({ length: qty }, () => ({ card_id: (newCard as any).id, owner: owner || "Joint", sold: false, storage_location: effectiveBag }));
      await supabase.from("card_copies").insert(copyRows);
    }

    // If a binder is selected, also save the image to community_images
    if (selectedBinder && currentPair.front) {
      let targetId: string | null = selectedSlotId;
      if (!targetId) {
        // No duplicate slots — find base slot first, fall back to first
        const { data: clRows } = await supabase
          .from("binder_checklist")
          .select("id, parallel")
          .eq("set_id", selectedBinder)
          .eq("card_number", safeCardNum)
          .order("position", { ascending: true });
        targetId = (clRows?.find((r: any) => !r.parallel || r.parallel.trim() === "") ?? clRows?.[0])?.id ?? null;
      }
      if (targetId) {
        const isBaseUpload = !parallel.trim();
        // Check if a base (no parallel) image already exists for this slot
        const { data: existingBase } = await supabase
          .from("community_images")
          .select("id")
          .eq("checklist_id", targetId)
          .is("parallel", null)
          .eq("status", "approved")
          .limit(1)
          .single();
        if (isBaseUpload) {
          // Base image: always replace whatever is there (base locks out parallels)
          await supabase.from("community_images").delete().eq("checklist_id", targetId);
          await supabase.from("community_images").insert({ checklist_id: targetId, image_url: currentPair.front, username: "Admin", status: "approved", uploaded_by: null, parallel: null });
        } else if (!existingBase) {
          // Parallel image: only write if no base image exists yet
          await supabase.from("community_images").delete().eq("checklist_id", targetId).eq("parallel", parallel.trim());
          await supabase.from("community_images").insert({ checklist_id: targetId, image_url: currentPair.front, username: "Admin", status: "approved", uploaded_by: null, parallel: parallel.trim() });
        }
        // If existingBase exists and this is a parallel upload, skip — base image is locked
      }
    }

    setSaving(false);
    setTitle("");
    setCardNumber("");
    clearUnlocked();
    setOcrRawText("");
    setMatchConfidence("");
    setBinderSlots([]);
    setSelectedSlotId(null);
    setBagOverride("");

    // After saving, check if we need to find the next available bag (backfill)
    // Re-query to find if current bag is now full and there's a lower bag with space
    const newCount = bagCount + 1;
    if (newCount >= BAG_CAPACITY) {
      // Current bag just filled — find next available (could be a lower bag with sold slots)
      const { data: copies } = await supabase
        .from("card_copies")
        .select("storage_location, sold")
        .like("storage_location", `%${currentSuffix}`);

      // paginate if needed
      let allCopies = copies ?? [];
      if (allCopies.length === 1000) {
        let from = 1000;
        while (true) {
          const { data: more } = await supabase
            .from("card_copies")
            .select("storage_location, sold")
            .like("storage_location", `%${currentSuffix}`)
            .range(from, from + 999);
          if (!more || more.length === 0) break;
          allCopies = allCopies.concat(more);
          if (more.length < 1000) break;
          from += 1000;
        }
      }

      const bagMap: Record<string, number> = {};
      for (const row of allCopies) {
        const loc = row.storage_location as string;
        if (!row.sold) bagMap[loc] = (bagMap[loc] ?? 0) + 1;
        else if (!(loc in bagMap)) bagMap[loc] = 0;
      }
      const { data: sealedData } = await supabase.from("full_bags").select("location");
      const sealed = new Set((sealedData ?? []).map((r: any) => r.location));
      const sorted = Object.entries(bagMap)
        .filter(([bag]) => !sealed.has(bag))
        .sort((a, b) => { const pa = parseBag(a[0]), pb = parseBag(b[0]); return (pa?.num ?? 0) - (pb?.num ?? 0); });
      const available = sorted.find(([bag, count]) => bag !== currentBag && count < BAG_CAPACITY);
      if (available) {
        // Backfill bag available — show modal, do NOT advance silently
        setCurrentBag(available[0]);
        setBagCount(available[1]);
        setBagChangedTo(available[0]);
      } else {
        setBagCount(newCount);
        setShowBagPrompt(true);
      }
    } else {
      setBagCount(newCount);
      advanceCard();
    }
  }

  function handleSkip() {
    setTitle("");
    setCardNumber("");
    clearUnlocked();
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
          {(() => { const s = loadProgress(); return s.batch ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
              <p className="text-sm font-medium text-teal-800">▶ Saved session: Batch {s.batch}, card {s.index + 1}</p>
              <div className="flex gap-2">
                <button onClick={() => { const s = loadProgress(); setSelectedBatch(s.batch!); setCurrentIndex(s.index); }} className="rounded-full bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700">Resume</button>
                <button onClick={() => { clearProgress(); window.location.reload(); }} className="rounded-full border border-teal-300 px-4 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100">Clear</button>
              </div>
            </div>
          ) : null; })()}
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
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-700">📦 Bag assignment</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-xs text-zinc-500">Current suffix (set identifier)</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={currentSuffix}
                    onChange={e => setCurrentSuffix(e.target.value.toUpperCase())}
                    className="w-24 rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm font-mono text-zinc-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentSuffix(nextSuffix(currentSuffix))}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    New set → {nextSuffix(currentSuffix)}
                  </button>
                </div>
              </div>
            </div>
            {bagStatusLoading
              ? <p className="text-xs text-zinc-400">Checking existing bags...</p>
              : bagStatus && <p className="text-xs font-medium text-teal-700">✓ {bagStatus}</p>
            }
            <div>
              <span className="text-xs text-zinc-500">Override starting bag</span>
              <input
                value={currentBag}
                onChange={e => setCurrentBag(e.target.value.toUpperCase())}
                placeholder="e.g. 2AAA"
                className="mt-1 w-full rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm font-mono text-zinc-900 outline-none"
              />
            </div>
          </div>
          <label className="mt-3 block">
            <span className="text-sm font-medium text-zinc-700">Owner</span>
            <select
              value={owner || ""}
              onChange={e => setOwner(e.target.value || null)}
              className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none"
            >
              <option value="">Not set</option>
              <option value="Tom">Tom</option>
              <option value="Jamie">Jamie</option>
              <option value="Joint">Joint</option>
            </select>
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-medium text-zinc-700">Category</span>
            <select
              value={category || ""}
              onChange={e => setCategory(e.target.value || null)}
              className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none"
            >
              <option value="">Not set</option>
              <option value="Football">⚽ Football</option>
              <option value="Disney">✨ Disney</option>
            </select>
          </label>
          {selectedBinder && (
            <label className="mt-3 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={binderImageMode}
                onChange={e => setBinderImageMode(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <span className="text-sm font-medium text-zinc-700">
                Binder image mode — save images to binder only, no card rows created
              </span>
            </label>
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
      {/* BAG FULL — need a new bag */}
      {showBagPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-3xl bg-white p-8 shadow-2xl max-w-md w-full space-y-5 border-4 border-amber-400">
            <div className="text-center">
              <p className="text-5xl mb-2">📦</p>
              <h2 className="text-2xl font-black text-zinc-900">Bag {currentBag} is full</h2>
              <p className="text-sm text-zinc-500 mt-1">Seal it, then get a new bag and write this label on it:</p>
            </div>
            <div className="rounded-2xl bg-amber-400 p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-900 mb-1">New bag label</p>
              <p className="text-6xl font-black text-white tracking-wider">{nextBagInSet(currentBag)}</p>
            </div>
            <p className="text-center text-sm text-zinc-600">Do not press confirm until the new bag is in your hand and labelled.</p>
            <button
              onClick={() => { setCurrentBag(nextBagInSet(currentBag)); setBagCount(0); setShowBagPrompt(false); }}
              className="w-full rounded-full bg-amber-500 px-5 py-4 text-base font-black text-white hover:bg-amber-600 shadow-lg"
            >
              ✓ Bag {nextBagInSet(currentBag)} is labelled — continue
            </button>
          </div>
        </div>
      )}

      {/* BAG CHANGED (backfill) — must acknowledge before continuing */}
      {bagChangedTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-3xl bg-white p-8 shadow-2xl max-w-md w-full space-y-5 border-4 border-teal-400">
            <div className="text-center">
              <p className="text-5xl mb-2">🔄</p>
              <h2 className="text-2xl font-black text-zinc-900">Bag changed!</h2>
              <p className="text-sm text-zinc-500 mt-1">A bag with free space was found. Next cards go into:</p>
            </div>
            <div className="rounded-2xl bg-teal-500 p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-100 mb-1">Put next card in</p>
              <p className="text-6xl font-black text-white tracking-wider">{bagChangedTo}</p>
              <p className="text-sm text-teal-100 mt-2">{bagCount}/{BAG_CAPACITY} slots used</p>
            </div>
            <p className="text-center text-sm text-zinc-600">Find this bag before pressing continue.</p>
            <button
              onClick={() => { setBagChangedTo(null); advanceCard(); }}
              className="w-full rounded-full bg-teal-600 px-5 py-4 text-base font-black text-white hover:bg-teal-700 shadow-lg"
            >
              ✓ I have bag {bagChangedTo} — continue
            </button>
          </div>
        </div>
      )}
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Card {currentIndex + 1} of {pairs.length}</h1>
          <p className="text-sm text-zinc-500">Batch: {selectedBatch} {selectedBinder && `| Checklist: ${binderSets.find(b => b.id === selectedBinder)?.title}`} {category && `| ${category}`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setTitle(""); setCardNumber(""); setOcrRawText(""); setMatchConfidence(""); } }} disabled={currentIndex === 0} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50 disabled:opacity-40">← Back</button>
          <button onClick={handleSkip} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50">Skip</button>
          <button onClick={() => { setSelectedBatch(null); setPairs([]); clearProgress(); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-zinc-700 hover:bg-slate-50">Back</button>
        </div>
      </div>

      {/* CURRENT BAG BANNER — always visible during scanning */}
      {currentBag && (
        <div className={`rounded-2xl p-4 flex items-center justify-between ${
          bagCount >= BAG_CAPACITY - 3
            ? "bg-red-500 border-2 border-red-600"
            : bagCount >= BAG_CAPACITY - 8
            ? "bg-amber-400 border-2 border-amber-500"
            : "bg-zinc-900 border-2 border-zinc-700"
        }`}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">📦</span>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${
                bagCount >= BAG_CAPACITY - 3 ? "text-red-100" : bagCount >= BAG_CAPACITY - 8 ? "text-amber-900" : "text-zinc-400"
              }`}>Current bag — put this card in:</p>
              <p className={`text-4xl font-black tracking-wider ${
                bagCount >= BAG_CAPACITY - 3 ? "text-white" : bagCount >= BAG_CAPACITY - 8 ? "text-amber-900" : "text-white"
              }`}>{bagOverride.trim() || currentBag}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${
              bagCount >= BAG_CAPACITY - 3 ? "text-white" : bagCount >= BAG_CAPACITY - 8 ? "text-amber-900" : "text-zinc-300"
            }`}>{bagCount}<span className="text-lg font-normal">/{BAG_CAPACITY}</span></p>
            <div className="mt-1 w-32 h-2 rounded-full bg-black/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  bagCount >= BAG_CAPACITY - 3 ? "bg-white" : bagCount >= BAG_CAPACITY - 8 ? "bg-amber-900" : "bg-orange-400"
                }`}
                style={{ width: `${Math.min(100, (bagCount / BAG_CAPACITY) * 100)}%` }}
              />
            </div>
            {bagCount >= BAG_CAPACITY - 3 && (
              <p className="text-xs font-bold text-white mt-1">⚠ Almost full!</p>
            )}
            <button
              type="button"
              onClick={() => setShowBagPrompt(true)}
              className="mt-1 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold text-white hover:bg-white/20"
            >
              Seal bag early
            </button>
          </div>
        </div>
      )}

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
                <span className="text-sm text-zinc-700 flex items-center gap-2">Set <input type="checkbox" checked={!!locked.setName} onChange={() => toggleLock("setName")} className="accent-amber-500" title="Lock value" />{locked.setName && <span className="text-xs text-amber-600">locked</span>}</span>
                <input value={setName} onChange={e => setSetName(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            </div>
            {binderSlots.length > 1 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800 mb-2">Multiple binder slots found — pick which slot this image goes into:</p>
                <div className="flex flex-col gap-1.5">
                  {binderSlots.map(slot => (
                    <label key={slot.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="binderSlot"
                        value={slot.id}
                        checked={selectedSlotId === slot.id}
                        onChange={() => setSelectedSlotId(slot.id)}
                        className="accent-amber-500"
                      />
                      <span className="text-xs text-zinc-700">
                        Position {slot.position} — {slot.player_name}
                        {slot.hasImage ? <span className="ml-1 text-emerald-600">(has image)</span> : <span className="ml-1 text-zinc-400">(empty)</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {!binderImageMode && (
              <>
                {category === "Football" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Team <input type="checkbox" checked={!!locked.team} onChange={() => toggleLock("team")} className="accent-amber-500" title="Lock" />{locked.team && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={team} onChange={e => setTeam(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Brand <input type="checkbox" checked={!!locked.brand} onChange={() => toggleLock("brand")} className="accent-amber-500" title="Lock" />{locked.brand && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Season <input type="checkbox" checked={!!locked.season} onChange={() => toggleLock("season")} className="accent-amber-500" title="Lock" />{locked.season && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={season} onChange={e => setSeason(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Parallel <input type="checkbox" checked={!!locked.parallel} onChange={() => toggleLock("parallel")} className="accent-amber-500" title="Lock" />{locked.parallel && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={parallel} onChange={e => setParallel(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Print Run (e.g. 150) <input type="checkbox" checked={!!locked.printRun} onChange={() => toggleLock("printRun")} className="accent-amber-500" title="Lock" />{locked.printRun && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={printRun} onChange={e => setPrintRun(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                  </div>
                )}
                {category === "Disney" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Parallel <input type="checkbox" checked={!!locked.parallel} onChange={() => toggleLock("parallel")} className="accent-amber-500" title="Lock" />{locked.parallel && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={parallel} onChange={e => setParallel(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Print Run (e.g. 150) <input type="checkbox" checked={!!locked.printRun} onChange={() => toggleLock("printRun")} className="accent-amber-500" title="Lock" />{locked.printRun && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={printRun} onChange={e => setPrintRun(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                  </div>
                )}
                {!category && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Team <input type="checkbox" checked={!!locked.team} onChange={() => toggleLock("team")} className="accent-amber-500" title="Lock" />{locked.team && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={team} onChange={e => setTeam(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Parallel <input type="checkbox" checked={!!locked.parallel} onChange={() => toggleLock("parallel")} className="accent-amber-500" title="Lock" />{locked.parallel && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={parallel} onChange={e => setParallel(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Brand <input type="checkbox" checked={!!locked.brand} onChange={() => toggleLock("brand")} className="accent-amber-500" title="Lock" />{locked.brand && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">Season <input type="checkbox" checked={!!locked.season} onChange={() => toggleLock("season")} className="accent-amber-500" title="Lock" />{locked.season && <span className="text-xs text-amber-600">locked</span>}</span>
                      <input value={season} onChange={e => setSeason(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                    </label>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm text-zinc-700 flex items-center gap-2">Price <input type="checkbox" checked={!!locked.price} onChange={() => toggleLock("price")} className="accent-amber-500" title="Lock" />{locked.price && <span className="text-xs text-amber-600">locked</span>}</span>
                    <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-zinc-700 flex items-center gap-2">Stock <input type="checkbox" checked={!!locked.stock} onChange={() => toggleLock("stock")} className="accent-amber-500" title="Lock" />{locked.stock && <span className="text-xs text-amber-600">locked</span>}</span>
                    <input value={stock} onChange={e => setStock(e.target.value)} type="number" className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-zinc-700 flex items-center gap-2">Status <input type="checkbox" checked={!!locked.status} onChange={() => toggleLock("status")} className="accent-amber-500" title="Lock" />{locked.status && <span className="text-xs text-amber-600">locked</span>}</span>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                </div>
              </>
            )}
            {!binderImageMode && currentBag && (
              <label className="block">
                <span className="text-sm text-zinc-700">Bag override <span className="text-xs text-zinc-400">(leave blank to use {currentBag})</span></span>
                <input value={bagOverride} onChange={e => setBagOverride(e.target.value)} placeholder={currentBag} className="mt-1 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-sm text-zinc-900 outline-none" />
              </label>
            )}
            <button type="button" onClick={handleSave} disabled={saving || (binderImageMode ? !cardNumber.trim() : !title.trim())} className="mt-2 w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50">
              {saving ? "Saving..." : "Save & Next"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}