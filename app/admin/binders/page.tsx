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
  is_active: boolean;
};

type ChecklistEntry = {
  id: string;
  card_number: string;
  player_name: string;
  team: string | null;
  parallel: string | null;
  position: number;
  hasImage?: boolean;
};

export default function AdminBindersPage() {
  const [sets, setSets] = useState<BinderSet[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [combineNames, setCombineNames] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingSet, setEditingSet] = useState<BinderSet | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Checklist editor
  const [checklistSet, setChecklistSet] = useState<BinderSet | null>(null);
  const [checklist, setChecklist] = useState<ChecklistEntry[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistSearch, setChecklistSearch] = useState("");
  const [editingEntry, setEditingEntry] = useState<ChecklistEntry | null>(null);
  const [entryName, setEntryName] = useState("");
  const [entryTeam, setEntryTeam] = useState("");
  const [entrySaving, setEntrySaving] = useState(false);

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
      let text: string;
      try {
        // Try UTF-8 first
        text = await csvFile.text();
        // If we see replacement characters, try Windows-1252
        if (text.includes("\uFFFD")) {
          const buffer = await csvFile.arrayBuffer();
          const decoder = new TextDecoder("windows-1252");
          text = decoder.decode(buffer);
        }
      } catch {
        text = await csvFile.text();
      }
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

      // Parse rows - handle trailing commas, quotes, and whitespace
      const checklistRows = dataLines.map((line, i) => {
        const cols = line.split(separator).map((c) => c.trim().replace(/,$/, "").replace(/^"|"$/g, "").trim());
        const playerName = combineNames && cols[2]
          ? `${cols[1] || ""} & ${cols[2]}`.trim()
          : cols[1] || "Unknown";
        return {
          set_id: binderSet.id,
          card_number: cols[0] || String(i + 1),
          player_name: playerName,
          team: combineNames ? null : (cols[2] || null),
          parallel: (combineNames ? cols[3] : cols[3]) || "Base",
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

  async function handleEdit(s: BinderSet) {
    setEditingSet(s);
    setEditTitle(s.title);
    setEditDesc(s.description ?? "");
  }

  async function handleEditSave() {
    if (!editingSet) return;
    setEditSaving(true);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase
      .from("binder_sets")
      .update({ title: editTitle.trim(), description: editDesc.trim() || null })
      .eq("id", editingSet.id);
    setEditSaving(false);
    setEditingSet(null);
    loadSets();
  }

  async function handleToggleActive(id: string, current: boolean) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("binder_sets").update({ is_active: !current }).eq("id", id);
    loadSets();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this binder set and all its checklist data?")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("binder_sets").delete().eq("id", id);
    loadSets();
  }

  async function openChecklist(s: BinderSet) {
    setChecklistSet(s);
    setChecklistSearch("");
    setChecklistLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("binder_checklist")
      .select("id, card_number, player_name, team, parallel, position")
      .eq("set_id", s.id)
      .order("position", { ascending: true });
    const entries = data || [];
    if (entries.length > 0) {
      const ids = entries.map((e: any) => e.id);
      const { data: imgs } = await supabase.from("community_images").select("checklist_id").in("checklist_id", ids);
      const withImage = new Set((imgs ?? []).map((i: any) => i.checklist_id));
      setChecklist(entries.map((e: any) => ({ ...e, hasImage: withImage.has(e.id) })));
    } else {
      setChecklist([]);
    }
    setChecklistLoading(false);
  }

  function startEditEntry(entry: ChecklistEntry) {
    setEditingEntry(entry);
    setEntryName(entry.player_name);
    setEntryTeam(entry.team || "");
  }

  async function saveEntry() {
    if (!editingEntry) return;
    setEntrySaving(true);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase
      .from("binder_checklist")
      .update({ player_name: entryName.trim(), team: entryTeam.trim() || null })
      .eq("id", editingEntry.id);
    setChecklist(prev => prev.map(e => e.id === editingEntry.id ? { ...e, player_name: entryName.trim(), team: entryTeam.trim() || null } : e));
    setEditingEntry(null);
    setEntrySaving(false);
  }

  async function clearEntryImage(entryId: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("community_images").delete().eq("checklist_id", entryId);
    setChecklist(prev => prev.map(e => e.id === entryId ? { ...e, hasImage: false } : e));
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="combineNames"
            checked={combineNames}
            onChange={(e) => setCombineNames(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-amber-500"
          />
          <label htmlFor="combineNames" className="text-sm text-[#1c1917]">
            Combine columns B &amp; C as player name <span className="text-xs text-[rgba(28,25,23,0.4)]">(for insert sets where column C is a second character, not a team)</span>
          </label>
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
                  <p className="text-xs text-[rgba(28,25,23,0.5)]">
                    {s.total_cards} cards · {Math.ceil(s.total_cards / 9)} pages
                    {s.description && <span> · {s.description}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openChecklist(s)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                  >
                    Checklist
                  </button>
                  <button
                    onClick={() => handleEdit(s)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#c89b3c] hover:bg-[rgba(200,155,60,0.08)] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(s.id, s.is_active)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      s.is_active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {s.is_active ? "Active" : "Hidden"}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {editingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingSet(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1c1917]">Edit Binder Set</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[rgba(28,25,23,0.6)]">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  placeholder="e.g. Full base set checklist"
                  className="mt-1 w-full resize-none rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none focus:border-[rgba(200,155,60,0.4)]"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="btn-gold flex-1 rounded-xl py-2 text-sm font-bold disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditingSet(null)} className="rounded-xl border border-[var(--vault-border)] px-4 py-2 text-sm text-[rgba(28,25,23,0.6)]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {checklistSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setChecklistSet(null)}>
          <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--vault-border)] px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#1c1917]">{checklistSet.title} — Checklist</h3>
                <p className="text-xs text-[rgba(28,25,23,0.5)]">{checklist.length} entries · click a name to edit</p>
              </div>
              <button onClick={() => setChecklistSet(null)} className="text-sm text-[rgba(28,25,23,0.4)] hover:text-[#1c1917]">✕ Close</button>
            </div>
            <div className="px-6 py-3 border-b border-[var(--vault-border)]">
              <input
                value={checklistSearch}
                onChange={e => setChecklistSearch(e.target.value)}
                placeholder="Search by name or card number..."
                className="w-full rounded-xl border border-[var(--vault-border)] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
              {checklistLoading ? (
                <p className="text-sm text-[rgba(28,25,23,0.5)]">Loading...</p>
              ) : (
                checklist
                  .filter(e => !checklistSearch || e.player_name.toLowerCase().includes(checklistSearch.toLowerCase()) || e.card_number.includes(checklistSearch))
                  .map(entry => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-xs text-[rgba(28,25,23,0.4)] font-mono">#{entry.card_number}</span>
                        {editingEntry?.id === entry.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={entryName}
                              onChange={e => setEntryName(e.target.value)}
                              className="rounded-lg border border-[var(--vault-border)] px-2 py-1 text-sm outline-none w-48"
                              autoFocus
                              onKeyDown={e => { if (e.key === "Enter") saveEntry(); if (e.key === "Escape") setEditingEntry(null); }}
                            />
                            <input
                              value={entryTeam}
                              onChange={e => setEntryTeam(e.target.value)}
                              placeholder="Team"
                              className="rounded-lg border border-[var(--vault-border)] px-2 py-1 text-sm outline-none w-28"
                              onKeyDown={e => { if (e.key === "Enter") saveEntry(); if (e.key === "Escape") setEditingEntry(null); }}
                            />
                            <button onClick={saveEntry} disabled={entrySaving} className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50">
                              {entrySaving ? "..." : "Save"}
                            </button>
                            <button onClick={() => setEditingEntry(null)} className="text-xs text-[rgba(28,25,23,0.4)]">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => startEditEntry(entry)} className="text-left text-sm text-[#1c1917] hover:text-amber-600">
                            {entry.player_name}
                            {entry.team && <span className="ml-2 text-xs text-[rgba(28,25,23,0.4)]">{entry.team}</span>}
                          </button>
                        )}
                      </div>
                      {entry.hasImage && editingEntry?.id !== entry.id && (
                        <button
                          onClick={() => { if (confirm(`Clear image for ${entry.player_name}?`)) clearEntryImage(entry.id); }}
                          className="text-xs text-red-400 hover:text-red-600 shrink-0"
                          title="Clear community image for this slot"
                        >
                          🗑 img
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
