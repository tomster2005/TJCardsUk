import type { Metadata } from "next";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildSetSlug } from "@/lib/cards/slug";

export const metadata: Metadata = {
  title: "Explore Trading Card Sets",
  description:
    "Discover every trading card set available on Collectra. Browse complete checklists for football, Disney and more.",
  alternates: { canonical: "https://collectrauk.com/discover" },
};

type SetInfo = {
  name: string;
  setSlug: string;
  cardCount: number;
  hasBinder: boolean;
};

async function getSets(): Promise<SetInfo[]> {
  try {
    const supabase = createServerSupabase();

    const [{ data: cards }, { data: binderSets }] = await Promise.all([
      supabase.from("cards").select("set_name, set_slug").eq("status", "published"),
      supabase.from("binder_sets").select("title"),
    ]);

    const binderTitles = new Set((binderSets ?? []).map((b) => b.title as string));

    const setMap = new Map<string, { count: number; slug: string }>();
    for (const c of cards ?? []) {
      const name = (c.set_name as string) || "Unknown";
      const slug = (c.set_slug as string | null) ?? buildSetSlug(name);
      const existing = setMap.get(name) ?? { count: 0, slug };
      existing.count++;
      setMap.set(name, existing);
    }

    return Array.from(setMap.entries())
      .map(([name, { count, slug }]) => ({
        name,
        setSlug: slug,
        cardCount: count,
        hasBinder: binderTitles.has(name),
      }))
      .sort((a, b) => b.cardCount - a.cardCount);
  } catch {
    return [];
  }
}

export default async function DiscoverPage() {
  const sets = await getSets();

  return (
    <Layout>
      <div className="space-y-6 animate-fade-up">

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #fef9ec 0%, #f8f6f2 100%)",
            border: "1px solid rgba(200,155,60,0.15)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 120% at 80% 50%, rgba(200,155,60,0.07), transparent)",
            }}
          />
          <div className="relative flex items-center justify-between gap-6 px-8 py-6 sm:px-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--gold-500)]">
                Discover
              </span>
              <h1 className="mt-1 text-2xl font-black text-zinc-900 font-display sm:text-3xl">
                Explore our sets
              </h1>
              <p className="mt-1 text-[13px] text-zinc-500">
                {sets.length} set{sets.length !== 1 ? "s" : ""} available
              </p>
            </div>
            {sets.length > 0 && (
              <div className="hidden sm:flex flex-col items-end gap-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Total cards
                </p>
                <p className="text-3xl font-black text-zinc-900">
                  {sets.reduce((a, s) => a + s.cardCount, 0)}
                </p>
              </div>
            )}
          </div>
        </section>

        {sets.length === 0 && (
          <div
            className="rounded-2xl p-16 text-center bg-white"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="text-lg font-bold text-zinc-700">No sets yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Cards will appear here once published.
            </p>
          </div>
        )}

        {sets.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
              <li key={set.name}>
                <article
                  className="card-lift overflow-hidden rounded-2xl bg-white flex flex-col"
                  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="h-1 w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--gold-400), var(--gold-300), var(--gold-400))",
                    }}
                  />
                  <div className="flex flex-col gap-4 p-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-[15px] font-black text-zinc-900 leading-tight">
                          {set.name}
                        </h2>
                        <p className="mt-0.5 text-[12px] text-zinc-400">
                          {set.cardCount} cards listed
                        </p>
                      </div>
                      {set.hasBinder && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{
                            background: "rgba(200,155,60,0.1)",
                            color: "var(--gold-600)",
                            border: "1px solid rgba(200,155,60,0.25)",
                          }}
                        >
                          Binder
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        href={`/catalogue/${set.setSlug}`}
                        className="block w-full rounded-xl py-2 text-center text-[12px] font-bold transition"
                        style={{
                          background: "linear-gradient(135deg, var(--gold-400), var(--gold-500))",
                          color: "#1a0e00",
                        }}
                      >
                        View checklist
                      </Link>
                      {set.hasBinder && (
                        <Link
                          href="/binder"
                          className="block w-full rounded-xl py-2 text-center text-[12px] font-bold transition"
                          style={{
                            background: "rgba(200,155,60,0.08)",
                            color: "var(--gold-600)",
                            border: "1px solid rgba(200,155,60,0.2)",
                          }}
                        >
                          Open binder
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
