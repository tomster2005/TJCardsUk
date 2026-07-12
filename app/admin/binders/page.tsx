"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type BinderSet = {
  id: string;
  title: string;
  description: string | null;
  set_name: string | null;
  total_cards: number;
  slug: string;
  created_at: string;
};

export default function AdminBindersPage() {
  const [sets, setSets] = useState<BinderSet[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSets();
  }, []);

  async function loadSets() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("binder_sets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSets(data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !csvFile) return;

    if (csvFile.name.endsWith(".xlsx") || csvFile.name.endsWith(".xls")) {
      setMessage("Error: Please save your spreadsheet as a .csv or .txt file first. Excel (.xlsx) files are not supported.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error("No supabase client");

      // Parse CSV/TSV
      const text = await csvFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      // Detect separator: tab or comma
      const firstLine = lines[0];
      const isTab = firstLine.includes("\t");
      const separator = isTab ? "\t" : ",";

      // Check if first line is a header
      const headerLower = firstLine.toLowerCase();
      const hasHeader = headerLower.includes("card_number") || headerLower.includes("player") || headerLower.includes("name");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      if (dataLines.length === 0) throw new Error("File has no data rows");

      // Create slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Insert binder set
      const { data: binderSet, error: setError } = await supabase
        .from("binder_sets")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          set_name: title.trim(),
          total_cards: dataLines.length,
          slug,
        })
        .select()
        .single();

      if (setError) throw setError;

      // Parse rows - handle trailing commas and whitespace
      const checklistRows = dataLines.map((line, i) => {
        const cols = line.split(separator).map((c) => c.trim().replace(/,$/, ""));
        return {
          set_id: binderSet.id,
          card_number: cols[0] || String(i + 1),
          player_name: cols[1] || "Unknown",
          team: cols[2] || null,
          parallel: cols[3] || "Base",
          page_number: Math.floor(i / 9) + 1,
          position: (i % 9) + 1,
        };
      });

      // Insert in batches of 100
      for (let i = 0; i < checklistRows.length; i += 100) {
        const batch = checklistRows.slice(i, i + 100);
        const { error } = await supabase.from("binder_checklist").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
      }

      setMessage(`Created "${title}" with ${dataLines.length} cards across ${Math.ceil(dataLines.length / 9)} pages`);
      setTitle("");
      setDescription("");
      setCsvFile(null);
      loadSets();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this binder set and all its checklist data?")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("binder_sets").delete().eq("id", id);
    loadSets();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1c1917]">Binder Sets</h1>
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Create binder checklists from CSV files</p>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-[var(--vault-border)] bg-[var(--vault-surface)] p-6">
        <h2 className="text-lg font-bold text-[#1c1917]">New Binder Set</h2>

        <div>
          <label className="block text-sm font-semibold text-[#1c1917]">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2024 Topps Chrome"
            className="mt-1 w-full rounded-xl border border-[var(--vault-border)] bg-white px-4 py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1c1917]">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Full base set checklist"
            className="mt-1 w-full rounded-xl border border-[var(--vault-border)] bg-white px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1c1917]">CSV File</label>
          <p className="text-xs text-[rgba(28,25,23,0.5)] mb-2">Accepts .csv or .txt (comma or tab separated). Format: card_number, player_name, team, parallel</p>
          <input
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="mt-1 w-full text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Binder Set"}
        </button>

        {message && (
          <p className={`text-sm font-medium ${message.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
            {message}
          </p>
        )}
      </form>

      {/* Existing sets */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#1c1917]">Existing Sets</h2>
        {sets.length === 0 ? (
          <p className="text-sm text-[rgba(28,25,23,0.5)]">No binder sets yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {sets.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-[var(--vault-border)] bg-[var(--vault-surface)] px-5 py-3">
                <div>
                  <p className="font-bold text-[#1c1917]">{s.title}</p>
                  <p className="text-xs text-[rgba(28,25,23,0.5)]">{s.total_cards} cards · {Math.ceil(s.total_cards / 9)} pages</p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
