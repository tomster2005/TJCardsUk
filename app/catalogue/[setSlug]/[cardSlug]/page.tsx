import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Layout } from "@/components/Layout";
import { CatalogueCardDetail } from "@/components/catalogue/CatalogueCardDetail";
import { buildPublicCardSlugs } from "@/lib/cards/slug";
import createServerSupabase from "@/lib/supabase/server";

type Props = {
  params: Promise<{ setSlug: string; cardSlug: string }> | { setSlug: string; cardSlug: string };
};

async function fetchCard(setSlug: string, cardSlug: string) {
  const supabase = createServerSupabase();
  const { data: matches, error } = await supabase
    .from("cards")
    .select("*")
    .eq("set_slug", setSlug)
    .eq("card_slug", cardSlug)
    .eq("status", "published");

  if (error || !matches || matches.length === 0) return null;
  return matches.find((c) => !c.parallel) ?? matches[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setSlug, cardSlug } = await Promise.resolve(params);
  const data = await fetchCard(setSlug, cardSlug);

  if (!data) {
    return { title: "Card not found" };
  }

  const playerName = data.player ?? "Unknown";
  const cardNumber = data.card_number ? `#${data.card_number}` : "";
  const setName = data.set_name ?? "";
  const parallel = data.parallel ? ` (${data.parallel})` : "";

  const title = [playerName, cardNumber, parallel, setName].filter(Boolean).join(" – ").replace(" – –", " –");
  const canonicalUrl = `https://collectrauk.com/catalogue/${setSlug}/${cardSlug}`;

  const descParts = [
    `${playerName}${cardNumber ? ` card number ${data.card_number}` : ""}`,
    setName ? `from the ${setName} set` : "",
    data.parallel ? `${data.parallel} parallel` : "",
    data.brand ? `by ${data.brand}` : "",
  ].filter(Boolean);
  const description = `${descParts.join(", ")}. Browse the complete ${setName} checklist and buy trading cards on Collectra.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | Collectra`,
      description,
      url: canonicalUrl,
      type: "website",
      images: data.image_url ? [{ url: data.image_url, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Collectra`,
      description,
      images: data.image_url ? [data.image_url] : [],
    },
  };
}

export default async function CatalogueCardPage({ params }: Props) {
  const { setSlug, cardSlug } = await Promise.resolve(params);
  const supabase = createServerSupabase();

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

  const { data: allVariants } = await supabase
    .from("cards")
    .select("id, player, card_number, parallel, price, stock, image_url, print_run, is_base_variant")
    .eq("card_number", data.card_number)
    .eq("set_name", data.set_name)
    .eq("status", "published");

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

  // Structured data
  const canonicalUrl = `https://collectrauk.com/catalogue/${setSlug}/${cardSlug}`;
  const setUrl = `https://collectrauk.com/catalogue/${setSlug}`;
  const playerName = card.playerName;
  const cardNumber = card.cardNumber;
  const setName = card.setName ?? "";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catalogue", item: "https://collectrauk.com/catalogue" },
      { "@type": "ListItem", position: 2, name: setName, item: setUrl },
      { "@type": "ListItem", position: 3, name: `${playerName} #${cardNumber}`, item: canonicalUrl },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${playerName} #${cardNumber}${card.parallel ? ` (${card.parallel})` : ""} – ${setName}`,
    description: `${playerName} trading card number ${cardNumber} from the ${setName} set${card.brand ? ` by ${card.brand}` : ""}.`,
    ...(card.imageUrl ? { image: card.imageUrl } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: Number(card.price ?? 0).toFixed(2),
      availability:
        card.stockStatus === "Out of stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: canonicalUrl,
      seller: { "@type": "Organization", name: "Collectra" },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Layout>
        <CatalogueCardDetail card={card} relatedCards={relatedCards} variants={variants} setSlug={setSlug} />
      </Layout>
    </>
  );
}
