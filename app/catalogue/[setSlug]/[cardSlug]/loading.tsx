import { Layout } from "@/components/Layout";

export default function LoadingCardDetailPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="animate-pulse rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-8">
          <div className="h-6 w-64 rounded bg-zinc-800" />
          <div className="mt-3 h-10 w-80 rounded bg-zinc-800" />
          <div className="mt-3 h-5 w-72 rounded bg-zinc-800" />

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/80 p-4">
              <div className="h-[460px] rounded-[1.25rem] bg-zinc-800" />
              <div className="mt-4 h-10 w-44 rounded-full bg-zinc-800" />
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/80 p-6">
              <div className="h-8 w-48 rounded bg-zinc-800" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="h-10 rounded-full bg-zinc-800" />
                <div className="h-10 rounded-full bg-zinc-800" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-xl bg-zinc-800" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="animate-pulse rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 sm:p-8">
          <div className="h-7 w-56 rounded bg-zinc-800" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
                <div className="h-32 rounded-xl bg-zinc-800" />
                <div className="mt-3 h-4 w-24 rounded bg-zinc-800" />
                <div className="mt-2 h-3 w-16 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}