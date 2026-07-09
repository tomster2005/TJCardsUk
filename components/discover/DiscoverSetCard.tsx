import Link from "next/link";

type DiscoverSetCardProps = {
  id: string;
  title: string;
  brand: string;
  year: number;
  totalCards: number;
  ownedCount: number;
  completion: number;
};

export function DiscoverSetCard({ id, title, brand, year, totalCards, ownedCount, completion }: DiscoverSetCardProps) {
  return (
    <Link href={`/sets/${id}`} className="group relative block overflow-hidden rounded-3xl border border-slate-300/55 bg-white/90 p-6 transition hover:border-amber-300/60 hover:bg-white card-lift">
      <div className="pointer-events-none absolute -right-12 -top-10 h-28 w-28 rounded-full bg-amber-200/35 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-700">{brand}</p>
          <h2 className="mt-3 text-2xl font-semibold text-zinc-900">{title}</h2>
          <p className="mt-2 text-sm text-zinc-600">{year}</p>
        </div>
        <div className="rounded-full border border-amber-300/45 bg-amber-100/90 px-3 py-1 text-sm font-semibold text-amber-900">
          {completion}%
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-300/55 bg-white/85 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Total cards</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{totalCards}</p>
        </div>
        <div className="rounded-3xl border border-slate-300/55 bg-white/85 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Owned</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{ownedCount}</p>
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200/80 skeleton-shimmer">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400" style={{ width: `${completion}%` }} />
      </div>
    </Link>
  );
}
