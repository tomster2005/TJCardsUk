import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import createServerSupabase from "@/lib/supabase/server";
import { buildPublicCardSlugs } from "@/lib/cards/slug";
import { formatGBP } from "@/lib/currency";
import { thumbUrl } from "@/lib/images";

type Props = {
  params: Promise<{ setSlug: string }> | { setSlug: string };
};

type CardRow = {
  id: string;
  player: string;
  card_number: string;
  set_name: string;
  set_slug: string | null;
  card_slug: string | null;
  parallel: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  brand: string | null;
  season: string | null;
};

async function fetchSetCards(setSlug: string): Promise<{ setName: string; cards: CardRow[] } | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("cards")
    .select("id, player, card_number, set_name, set_slug, card_slug, parallel, price, stock, image_url, brand, season")
    .eq("set_slug", setSlug)
    .eq("status", "published")
    .is("parallel", null)
    .order("card_number", { ascending: true });

  if (error || !data || data.length === 0) return null;

  const setName = data[0].set_name ?? "";
  return { setName, cards: data as CardRow[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setSlug } = await Promise.resolve(params);
  const result = await fetchSetCards(setSlug);

  if (!result) return { title: "Set not found" };

  const { setName, cards } = result;
  const brand = cards[0]?.brand ?? "";
  const season = cards[0]?.season ?? "";
  const canonicalUrl = `https://collectrauk.com/catalogue/${setSlug}`;

  const title = `${setName} Checklist & Card List`;
  const description = `Complete ${setName} checklist with all ${cards.length} cards${brand ? ` by ${brand}` : ""}${season ? ` (${season})` : ""}. Browse every card, check card numbers and buy individual cards on Collectra.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | Collectra`,
      description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function SetChecklistPage({ params }: Props) {
  const { setSlug } = await Promise.resolve(params);
  const result = await fetchSetCards(setSlug);

  if (!result) notFound();

  const { setName, cards } = result;
  const brand = cards[0]?.brand ?? "";
  const season = cards[0]?.season ?? "";
  const canonicalUrl = `https://collectrauk.com/catalogue/${setSlug}`;
  const inStockCount = cards.filter((c) => Number(c.stock) > 0).length;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catalogue", item: "https://collectrauk.com/catalogue" },
      { "@type": "ListItem", position: 2, name: setName, item: canonicalUrl },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${setName} Checklist`,
    description: `Complete card list for ${setName}`,
    numberOfItems: cards.length,
    itemListElement: cards.slice(0, 50).map((card, i) => {
      const cardSlug = card.card_slug ?? buildPublicCardSlugs({ setName: card.set_name, player: card.player, cardNumber: card.card_number }).cardSlug;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: `${card.player} #${card.card_number}`,
        url: `https://collectrauk.com/catalogue/${setSlug}/${cardSlug}`,
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Layout>
        <div className="space-y-6">

          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <Link href="/catalogue" className="hover:text-white transition">Catalogue</Link>
            <span>/</span>
            <span className="text-white">{setName}</span>
          </nav>

          {/* Header */}
          <section
            className="rounded-3xl p-6 sm:p-8"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.35em]"
              style={{ color: "#F26A21" }}
            >
              {brand || "Trading Cards"}
            </p>
            <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">
              {setName}
            </h1>
            <p className="mt-2 text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {season && <span>{season} · </span>}
              {cards.length} card{cards.length !== 1 ? "s" : ""} in this set
              {inStockCount > 0 && <span> · {inStockCount} available to buy</span>}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Browse the complete {setName} checklist below. Every base card is listed with its card number.
              Click any card to view full details, parallels and buy options.
            </p>
          </section>

          {/* Card grid */}
          <section>
            <h2
              className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Complete checklist — {cards.length} cards
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {cards.map((card) => {
                const cardSlug = card.card_slug ?? buildPublicCardSlugs({
                  setName: card.set_name,
                  player: card.player,
                  cardNumber: card.card_number,
                }).cardSlug;
                const inStock = Number(card.stock) > 0;

                return (
                  <li key={card.id}>
                    <Link
                      href={`/catalogue/${setSlug}/${cardSlug}`}
                      className="group block rounded-2xl overflow-hidden transition hover:border-amber-400/30"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="relative overflow-hidden" style={{ paddingBottom: "140%" }}>
                        {card.image_url ? (
                          <img
                            src={thumbUrl(card.image_url, 200)}
                            alt={`${card.player} #${card.card_number} – ${setName}`}
                            loading="lazy"
                            decoding="async"
                            width={200}
                            height={280}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                          >
                            <span className="text-3xl opacity-20">🃏</span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span
                          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{
                            background: inStock ? "rgba(8,123,117,0.9)" : "rgba(220,38,38,0.85)",
                            color: "white",
                          }}
                        >
                          {inStock ? "In stock" : "Sold out"}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[13px] font-bold text-white">{card.player}</p>
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                          #{card.card_number}
                        </p>
                        <p className="mt-1 text-[13px] font-black" style={{ color: "#F26A21" }}>
                          {formatGBP(Number(card.price ?? 0))}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Back link */}
          <div className="pt-2">
            <Link
              href="/catalogue"
              className="text-[13px] font-semibold transition hover:text-white"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              ← Browse all cards
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
