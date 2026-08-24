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

  // ── 1. Fetch only the matching card(s) by indexed slug columns ────────
  // Prefer the base card (no parallel) if multiple rows share the same slug.
  const { data: matches, error } = await supabase
    .from("cards")
    .select("*")
    .eq("set_slug", setSlug)
    .eq("card_slug", cardSlug)
    .eq("status", "published");

  if (error) throw new Error("Unable to load catalogue card.");
  if (!matches || matches.length === 0) notFound();

  const data = matches.find((c) => !c.parallel) ?? matches[0];
  if (!data) notFound();

  // ── 2. Fetch all variants (base + parallels) for this card ────────────
  const { data: allVariants } = await supabase
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

  // ── 3. Fetch related cards from the same set — indexed query ──────────
  const { data: relatedRows } = await supabase
    .from("cards")
    .select("id, player, card_number, price, image_url, set_name, set_slug, card_slug")
    .eq("set_slug", setSlug)
    .eq("status", "published")
    .is("parallel", null)
    .neq("id", resolvedData.id)
    .limit(4);

  const relatedCards = (relatedRows ?? []).map((item) => ({
    id: item.id,
    playerName: item.player ?? "Unknown",
    cardNumber: String(item.card_number ?? "?"),
    price: Number(item.price ?? 0),
    imageUrl: item.image_url ?? undefined,
    setSlug: item.set_slug ?? setSlug,
    cardSlug: item.card_slug ?? buildPublicCardSlugs({
      setName: item.set_name,
      player: item.player,
      cardNumber: item.card_number,
    }).cardSlug,
  }));

  return (
    <Layout>
      <CatalogueCardDetail card={card} relatedCards={relatedCards} variants={variants} />
    </Layout>
  );
}
