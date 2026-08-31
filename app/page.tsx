import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildSetSlug } from "@/lib/cards/slug";

export const metadata: Metadata = {
  title: "Collectra — Trading Card Catalogue & Collection Tracker",
  description:
    "Collectra is the UK trading card platform for football, Disney and more. Browse complete card checklists, buy individual cards and track your collection all in one place.",
  alternates: { canonical: "https://collectrauk.com" },
  openGraph: {
    title: "Collectra — Trading Card Catalogue & Collection Tracker",
    description:
      "Collectra is the UK trading card platform for football, Disney and more. Browse complete card checklists, buy individual cards and track your collection all in one place.",
    url: "https://collectrauk.com",
    type: "website",
  },
};

type SetSummary = { name: string; cardCount: number; setSlug: string };

async function getSetSummaries(): Promise<SetSummary[]> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("cards")
      .select("set_name, set_slug")
      .eq("status", "published")
      .not("set_name", "is", null);

    if (!data) return [];

    const map = new Map<string, { count: number; slug: string }>();
    for (const row of data) {
      const name = row.set_name as string;
      const slug = (row.set_slug as string | null) ?? buildSetSlug(name);
      const existing = map.get(name) ?? { count: 0, slug };
      existing.count++;
      map.set(name, existing);
    }

    return Array.from(map.entries())
      .map(([name, { count, slug }]) => ({ name, cardCount: count, setSlug: slug }))
      .sort((a, b) => b.cardCount - a.cardCount)
      .slice(0, 6);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const sets = await getSetSummaries();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Collectra",
    url: "https://collectrauk.com",
    description:
      "UK trading card catalogue and collection tracker for football, Disney and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://collectrauk.com/catalogue?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Collectra",
    url: "https://collectrauk.com",
    logo: "https://collectrauk.com/og-image.png",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <div
        className="flex min-h-screen flex-col"
        style={{
          background:
            "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)",
        }}
      >
        {/* Nav */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
          style={{
            background: "#0D1212",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Link href="/" className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-black text-white"
              style={{
                background: "linear-gradient(135deg, #F5854A, #F26A21)",
                boxShadow: "0 4px 16px rgba(242,106,33,0.4)",
              }}
            >
              C
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-bold text-white">Collectra</span>
              <span
                className="text-[8px] uppercase tracking-[0.3em]"
                style={{ color: "rgba(242,106,33,0.6)" }}
              >
                The Vault
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/catalogue"
              className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/5"
            >
              Browse Cards
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-[13px] font-semibold transition"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Sign in
            </Link>
          </nav>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="mx-auto max-w-4xl px-6 py-20 text-center">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.4em]"
              style={{ color: "rgba(242,106,33,0.7)" }}
            >
              UK Trading Cards
            </p>
            <h1 className="mt-4 text-5xl font-black text-white sm:text-6xl">
              Your trading card catalogue,{" "}
              <span style={{ color: "#F26A21" }}>all in one place.</span>
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Browse complete checklists for football, Disney and more. Find
              individual cards, track your collection and buy directly from the
              vault.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/catalogue"
                className="rounded-full px-8 py-3.5 text-[14px] font-black text-[#1a0e00] transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #f5d97a, #c89b3c)",
                  boxShadow: "0 4px 20px rgba(200,155,60,0.4)",
                }}
              >
                Browse the catalogue
              </Link>
              <Link
                href="/register"
                className="rounded-full border px-8 py-3.5 text-[14px] font-semibold transition hover:border-white/20 hover:text-white"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Create free account
              </Link>
            </div>
          </section>

          {/* Sets */}
          {sets.length > 0 && (
            <section className="mx-auto max-w-5xl px-6 pb-20">
              <h2
                className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Browse by set
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sets.map((set) => (
                  <li key={set.name}>
                    <Link
                      href={`/catalogue/${set.setSlug}`}
                      className="flex items-center justify-between rounded-2xl p-5 transition hover:border-amber-400/30"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div>
                        <p className="text-[14px] font-bold text-white">
                          {set.name}
                        </p>
                        <p
                          className="mt-0.5 text-[12px]"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {set.cardCount} card{set.cardCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className="text-[12px] font-semibold"
                        style={{ color: "#F26A21" }}
                      >
                        View checklist →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-center">
                <Link
                  href="/catalogue"
                  className="text-[13px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  View all cards →
                </Link>
              </div>
            </section>
          )}

          {/* Features */}
          <section
            className="border-t py-16"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="mx-auto max-w-4xl px-6">
              <ul className="grid gap-8 sm:grid-cols-3">
                {[
                  {
                    icon: "🃏",
                    title: "Complete checklists",
                    desc: "Every card in every set, with card numbers, parallels and print runs.",
                  },
                  {
                    icon: "📦",
                    title: "Buy individual cards",
                    desc: "Purchase directly from the vault with secure UK checkout.",
                  },
                  {
                    icon: "✅",
                    title: "Track your collection",
                    desc: "Mark cards as owned, create binders and see what you still need.",
                  },
                ].map((f) => (
                  <li key={f.title} className="text-center">
                    <span className="text-3xl">{f.icon}</span>
                    <h3 className="mt-3 text-[14px] font-bold text-white">
                      {f.title}
                    </h3>
                    <p
                      className="mt-1 text-[13px] leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {f.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <footer
          className="px-6 py-6 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            © {new Date().getFullYear()} Collectra. All rights reserved. ·{" "}
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.2)" }}>
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/returns" style={{ color: "rgba(255,255,255,0.2)" }}>
              Returns
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}
