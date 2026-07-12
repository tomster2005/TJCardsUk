"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type CommunityImage = {
  id: string;
  image_url: string;
  username: string | null;
  uploaded_by: string;
  status: string;
  created_at: string;
  checklist_id: string;
  card_number?: string;
  player_name?: string;
};

export default function CommunityImagesPage() {
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => { loadImages(); }, [filter]);

  async function loadImages() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const { data } = await supabase
      .from("community_images")
      .select("*, binder_checklist(card_number, player_name)")
      .eq("status", filter)
      .order("created_at", { ascending: false });

    if (data) {
      setImages(data.map((d: any) => ({
        ...d,
        card_number: d.binder_checklist?.card_number,
        player_name: d.binder_checklist?.player_name,
      })));
    }
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.from("community_images").update({ status }).eq("id", id);
    loadImages();
  }

  async function checkUserWarning(userId: string) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { count } = await supabase
      .from("community_images")
      .select("*", { count: "exact", head: true })
      .eq("uploaded_by", userId)
      .eq("status", "rejected");

    if (count && count >= 10) {
      alert(`Warning: This user has ${count} rejected images. Consider banning.`);
    }
  }

  async function handleReject(img: CommunityImage) {
    await updateStatus(img.id, "rejected");
    await checkUserWarning(img.uploaded_by);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1c1917]">Community Images</h1>
        <p className="text-sm text-[rgba(28,25,23,0.5)]">Review user-submitted card photos</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              filter === s ? "btn-gold" : "border border-[var(--vault-border)] text-[rgba(28,25,23,0.6)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <p className="text-sm text-[rgba(28,25,23,0.5)]">No {filter} images.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border border-[var(--vault-border)] bg-white">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={img.image_url} alt={img.player_name || "Card"} className="h-full w-full object-contain bg-[#f5f3ee]" />
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-[#1c1917]">#{img.card_number} - {img.player_name}</p>
                <p className="text-xs text-[rgba(28,25,23,0.5)]">By: {img.username || "Anonymous"}</p>
                <p className="text-[10px] text-[rgba(28,25,23,0.3)]">{new Date(img.created_at).toLocaleDateString()}</p>

                {filter === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(img.id, "approved")}
                      className="flex-1 rounded-lg bg-green-50 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(img)}
                      className="flex-1 rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
