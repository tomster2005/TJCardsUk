type SetDetailHeaderProps = {
  title: string;
  brand: string;
  year: number;
  completion: number;
  ownedCount: number;
  totalCards: number;
  missingCards: number;
};

export function SetDetailHeader({ title, brand, year, completion, ownedCount, totalCards, missingCards }: SetDetailHeaderProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8 shadow-2xl shadow-black/30">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-amber-300/80">
          <span>{brand}</span>
          <span className="h-px flex-1 bg-white/10" />
          <span>{year}</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-zinc-400">{ownedCount} / {totalCards} cards owned · {missingCards} missing</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
          <span>Progress</span>
          <span className="font-semibold text-white">{completion}% complete</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${completion}%` }} />
        </div>
      </div>
    </div>
  );
}
