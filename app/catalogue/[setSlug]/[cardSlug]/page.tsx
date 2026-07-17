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

  if (error) throw new Error("Unable to load catalogue card.");
  if (!cards || cards.length === 0) notFound();

  const matches = cards.filter((card) => {
    const { setSlug: rowSetSlug, cardSlug: rowCardSlug } = buildPublicCardSlugs({
      setName: card.set_name ?? card.setName,
      title: card.title,
      player: card.player,
      cardNumber: card.card_number ?? card.cardNumber,
    });
    return rowSetSlug === setSlug && rowCardSlug === cardSlug;
  });

  // Prefer the base card (no parallel) if multiple rows share the same slug
  const data = matches.find((c) => !c.parallel) ?? matches[0];

  if (!data) notFound();

  // Fetch all cards with same card_number + set_name (base + all parallels)
  const { data: allVariants, error: variantError } = await supabase
    .from("cards")
    .select("id, player, card_number, parallel, price, stock, image_url, print_run, is_base_variant")
    .eq("card_number", data.card_number)
    .eq("set_name", data.set_name)
    .eq("status", "published");

  // If we landed on a parallel, find the base to use as the primary card
  const resolvedData = data.parallel
    ? (allVariants ?? []).find((v) => !v.parallel) ?? data
    : data;

  const variantRows = (allVariants ?? []).filter((v) => v.id !== resolvedData.id);

  const rawStock = Number(resolvedData.stock ?? resolvedData.quantity);
  const availableQuantity = Number.isFinite(rawStock) ? Math.max(0, rawStock) : undefined;

  const card = {
    id: resolvedData.id,
    playerName: resolvedData.player ?? resolvedData.player_name ?? resolvedData.playerName ?? "Unknown",
    cardNumber: resolvedData.card_number ?? resolvedData.cardNumber ?? "?",
    availableQuantity,
    team: resolvedData.team,
    setName: resolvedData.set_name ?? resolvedData.setName,
    brand: resolvedData.brand,
    parallel: resolvedData.parallel,
    price: resolvedData.price,
    stockStatus: resolvedData.stock_status ?? (availableQuantity === undefined ? "In stock" : availableQuantity > 0 ? "In stock" : "Out of stock"),
    imageUrl: resolvedData.image_url ?? resolvedData.imageUrl,
    backImageUrl: resolvedData.back_image_url ?? resolvedData.backImageUrl,
    description: resolvedData.description,
    season: resolvedData.season,
    condition: resolvedData.condition,
    estimatedValue: resolvedData.estimated_value ?? resolvedData.estimatedValue,
    marketplacePrice: resolvedData.marketplace_price ?? resolvedData.marketplacePrice,
    printRun: resolvedData.print_run ?? resolvedData.printRun,
    population: resolvedData.population,
    isOneOfOne: resolvedData.is_one_of_one ?? resolvedData.isOneOfOne,
  };

  const variants = variantRows.map((v) => {
    const rawS = Number(v.stock);
    const avail = Number.isFinite(rawS) ? Math.max(0, rawS) : undefined;
    const stockStatus = avail === undefined ? "In stock" : avail > 0 ? "In stock" : "Out of stock";
    return {
      id: v.id,
      parallel: v.parallel ?? "Base",
      price: Number(v.price ?? 0),
      imageUrl: v.image_url ?? null,
      printRun: v.print_run ?? null,
      stockStatus,
      availableQuantity: avail,
      isBase: !v.parallel,
    };
  });

  const relatedCards = cards
    .filter((item) => item.id !== resolvedData.id && !item.parallel)
    .filter((item) => (item.set_name ?? "") === (resolvedData.set_name ?? ""))
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
      <CatalogueCardDetail card={card} relatedCards={relatedCards} variants={variants} />
    </Layout>
  );
}
