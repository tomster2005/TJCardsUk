import Link from "next/link";
import { Layout } from "@/components/Layout";

export default function CatalogueCardNotFound() {
  return (
    <Layout>
      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-10 text-center shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Catalogue</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Card not found</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">This published card does not exist, or the URL is no longer valid.</p>
        <div className="mt-6">
          <Link href="/catalogue" className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100">
            Back to catalogue
          </Link>
        </div>
      </div>
    </Layout>
  );
}