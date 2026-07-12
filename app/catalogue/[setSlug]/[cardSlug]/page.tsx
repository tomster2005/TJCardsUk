import { notFound } from "next/navigation";
import { Layout } from "@/components/Layout";
import { CatalogueCardDetail } from "@/components/catalogue/CatalogueCardDetail";
import { buildPublicCardSlugs } from "@/lib/cards/slug";
import createServerSupabase from "@/lib/supabase/server";

type Props = {
  params: Promise<{ setSlug: string; cardSlug: string }> | { setSlug: string; cardSlug: string };
};

export default async function CatalogueCardPage({ params }: Props) {
  const { setSlug, cardSlug } = await Promise.resolve(params);
  const supabase = createServerSupabase();

  const { data: cards, error } = await supabase.from("cards").select("*").eq("status", "published").order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load catalogue card.");
  }

  if (!cards || cards.length === 0) {
    notFound();
  }

  const data = cards.find((card) => {
    const { setSlug: rowSetSlug, cardSlug: rowCardSlug } = buildPublicCardSlugs({
      setName: card.set_name ?? card.setName,
      title: card.title,
      player: card.player,
      cardNumber: card.card_number ?? card.cardNumber,
    });
    return rowSetSlug === setSlug && rowCardSlug === cardSlug;
  });

  if (!data) {
    notFound();
  }

  const rawStock = Number(data.stock ?? data.quantity);
  const availableQuantity = Number.isFinite(rawStock) ? Math.max(0, rawStock) : undefined;

  const card = {
    id: data.id,
    playerName: data.player ?? data.player_name ?? data.playerName ?? "Unknown",
    cardNumber: data.card_number ?? data.cardNumber ?? "?",
    availableQuantity,
    team: data.team,
    setName: data.set_name ?? data.setName,
    brand: data.brand,
    parallel: data.parallel,
    price: data.price,
    stockStatus: data.stock_status ?? (availableQuantity === undefined ? "In stock" : availableQuantity > 0 ? "In stock" : "Out of stock"),
    imageUrl: data.image_url ?? data.imageUrl,
    backImageUrl: data.back_image_url ?? data.backImageUrl,
    description: data.description,
    season: data.season,
    condition: data.condition,
    estimatedValue: data.estimated_value ?? data.estimatedValue,
    marketplacePrice: data.marketplace_price ?? data.marketplacePrice,
    printRun: data.print_run ?? data.printRun,
    population: data.population,
    isOneOfOne: data.is_one_of_one ?? data.isOneOfOne,
  };

  const relatedCards = cards
    .filter((item) => item.id !== data.id)
    .filter((item) => (item.set_name ?? item.setName ?? "") === (data.set_name ?? data.setName ?? ""))
    .slice(0, 4)
    .map((item) => {
      const { setSlug: relatedSetSlug, cardSlug: relatedCardSlug } = buildPublicCardSlugs({
        setName: item.set_name ?? item.setName,
        title: item.title,
        player: item.player,
        cardNumber: item.card_number ?? item.cardNumber,
      });

      return {
        id: item.id,
        playerName: item.player ?? item.player_name ?? item.title ?? "Unknown",
        cardNumber: String(item.card_number ?? item.cardNumber ?? "?"),
        price: Number(item.price ?? 0),
        imageUrl: item.image_url ?? item.imageUrl,
        setSlug: relatedSetSlug,
        cardSlug: relatedCardSlug,
      };
    });

  return (
    <Layout>
      <CatalogueCardDetail card={card} relatedCards={relatedCards} />
    </Layout>
  );
}
