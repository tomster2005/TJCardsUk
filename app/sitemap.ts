import { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildPublicCardSlugs } from "@/lib/cards/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://collectra.com";

  // Static pages
  const static_pages: MetadataRoute.Sitemap = [
    { url: base, priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/catalogue`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/discover`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${base}/binder`, priority: 0.6, changeFrequency: "weekly" },
  ];

  // Dynamic card pages
  try {
    const supabase = createServerSupabase();
    const { data: cards } = await supabase
      .from("cards")
      .select("id, title, player, set_name, card_number, parallel, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    const cardPages: MetadataRoute.Sitemap = (cards ?? []).map((card: any) => {
      const { setSlug, cardSlug } = buildPublicCardSlugs({
        setName: card.set_name,
        title: card.title ?? card.player,
        cardNumber: card.card_number,
      });
      return {
        url: `${base}/catalogue/${setSlug}/${cardSlug}`,
        lastModified: card.updated_at ? new Date(card.updated_at) : new Date(),
        priority: 0.8,
        changeFrequency: "weekly" as const,
      };
    });

    return [...static_pages, ...cardPages];
  } catch {
    return static_pages;
  }
}
