import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import { CatalogueGrid } from "@/components/catalogue/CatalogueGrid";

export const metadata: Metadata = {
  title: "Trading Card Catalogue",
  description:
    "Browse and explore trading card sets and individual cards with Collectra, the digital platform for completing your trading card collection.",
  alternates: { canonical: "https://collectrauk.com/catalogue" },
  openGraph: {
    title: "Trading Card Catalogue | Collectra",
    description:
      "Browse and explore trading card sets and individual cards with Collectra, the digital platform for completing your trading card collection.",
    url: "https://collectrauk.com/catalogue",
    type: "website",
  },
};

export default function CataloguePage() {
  return (
    <Layout>
      <CatalogueGrid />
    </Layout>
  );
}
