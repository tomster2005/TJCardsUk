"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";

interface CardPair {
  id: number;
  front: File;
  back: File;
  frontPreview: string;
  backPreview: string;
}

export default function BulkUploadPage() {
  const [pairs, setPairs] = useState<CardPair[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

    if (sorted.length % 2 !== 0) {
      setError("You must upload an even number of images (each card needs a front and back).");
      return;
    }

    const newPairs: CardPair[] = [];
    for (let i = 0; i < sorted.length; i += 2) {
      newPairs.push({
        id: i / 2,
        front: sorted[i],
        back: sorted[i + 1],
        frontPreview: URL.createObjectURL(sorted[i]),
        backPreview: URL.createObjectURL(sorted[i + 1]),
      });
    }

    setError(null);
    setSuccess(null);
    setPairs(newPairs);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleUpload = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) { setError("Not connected to Supabase."); return; }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress({ done: 0, total: pairs.length });

    const batchId = Date.now().toString(36);

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const cardNum = String(i + 1).padStart(4, "0");

      const frontExt = pair.front.name.split(".").pop();
      const backExt = pair.back.name.split(".").pop();

      const frontPath = `${batchId}/${cardNum}_front.${frontExt}`;
      const backPath = `${batchId}/${cardNum}_back.${backExt}`;

      const { error: e1 } = await supabase.storage.from("card-images").upload(frontPath, pair.front);
      if (e1) { setError(`Failed uploading front of card ${i + 1}: ${e1.message}`); setUploading(false); return; }

      const { error: e2 } = await supabase.storage.from("card-images").upload(backPath, pair.back);
      if (e2) { setError(`Failed uploading back of card ${i + 1}: ${e2.message}`); setUploading(false); return; }

      setProgress({ done: i + 1, total: pairs.length });
    }

    setUploading(false);
    setSuccess(`Successfully uploaded ${pairs.length} card pairs (batch: ${batchId}).`);
    setPairs([]);
  };

  const clear = () => {
    pairs.forEach(p => { URL.revokeObjectURL(p.frontPreview); URL.revokeObjectURL(p.backPreview); });
    setPairs([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)] flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Bulk Image Upload</h1>
          <p className="mt-2 text-zinc-600">
            Upload scanned card images. Files are sorted by name and paired: odd = front, even = back.
          </p>
        </div>
        <Link href="/admin/bulk-upload/process" className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-600">
          Process Cards
        </Link>
      </div>

      {/* Drop zone */}
      {pairs.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-white/80 p-16 text-center transition hover:border-amber-400 hover:bg-amber-50/30"
        >
          <p className="text-lg font-medium text-zinc-700">Drop images here or click to select</p>
          <p className="mt-1 text-sm text-zinc-500">Select all front &amp; back images at once (even number required)</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files && processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>
      )}

      {/* Preview grid */}
      {pairs.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm">
            <span className="text-sm font-medium text-zinc-700">{pairs.length} card pairs ready</span>
            <div className="flex gap-3">
              <button onClick={clear} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-slate-50">
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50"
              >
                {uploading ? `Uploading ${progress.done}/${progress.total}...` : "Upload All"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pairs.map((pair) => (
              <div key={pair.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-center text-xs font-semibold text-zinc-500">Card {pair.id + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-center text-[10px] uppercase text-zinc-400">Front</p>
                    <img src={pair.frontPreview} alt={`Card ${pair.id + 1} front`} className="aspect-[2/3] w-full rounded-lg object-contain bg-slate-50" />
                  </div>
                  <div>
                    <p className="mb-1 text-center text-[10px] uppercase text-zinc-400">Back</p>
                    <img src={pair.backPreview} alt={`Card ${pair.id + 1} back`} className="aspect-[2/3] w-full rounded-lg object-contain bg-slate-50 rotate-180" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
