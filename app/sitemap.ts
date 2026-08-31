import { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildPublicCardSlugs, buildSetSlug } from "@/lib/cards/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://collectrauk.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/catalogue`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/discover`, priority: 0.7, changeFrequency: "weekly" },
  ];

  try {
    const supabase = createServerSupabase();
    const { data: cards } = await supabase
      .from("cards")
      .select("id, title, player, set_name, set_slug, card_slug, card_number, parallel, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (!cards) return staticPages;

    // Build set-level pages — one entry per unique set_slug
    const setMap = new Map<string, { setName: string; lastMod: Date }>();
    for (const card of cards) {
      const slug = (card.set_slug as string | null) ?? buildSetSlug(card.set_name ?? "");
      if (!slug) continue;
      const existing = setMap.get(slug);
      const cardDate = card.updated_at ? new Date(card.updated_at) : new Date();
      if (!existing || cardDate > existing.lastMod) {
        setMap.set(slug, { setName: card.set_name ?? "", lastMod: cardDate });
      }
    }

    const setPages: MetadataRoute.Sitemap = Array.from(setMap.entries()).map(([slug, { lastMod }]) => ({
      url: `${base}/catalogue/${slug}`,
      lastModified: lastMod,
      priority: 0.85,
      changeFrequency: "weekly" as const,
    }));

    // Individual card pages — base cards only (no parallels)
    const cardPages: MetadataRoute.Sitemap = cards
      .filter((card) => !card.parallel)
      .map((card) => {
        const setSlug = (card.set_slug as string | null) ?? buildSetSlug(card.set_name ?? "");
        const cardSlug = (card.card_slug as string | null) ?? buildPublicCardSlugs({
          setName: card.set_name,
          title: card.title ?? card.player,
          cardNumber: card.card_number,
        }).cardSlug;
        return {
          url: `${base}/catalogue/${setSlug}/${cardSlug}`,
          lastModified: card.updated_at ? new Date(card.updated_at) : new Date(),
          priority: 0.8,
          changeFrequency: "weekly" as const,
        };
      });

    return [...staticPages, ...setPages, ...cardPages];
  } catch {
    return staticPages;
  }
}
