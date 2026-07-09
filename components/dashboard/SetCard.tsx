type SetCardProps = {
  title: string;
  progress: number;
  status: string;
};

export function SetCard({ title, progress, status }: SetCardProps) {
  return (
    <div className="rounded-3xl border border-slate-300/45 bg-white/92 p-5 card-lift">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-sm text-zinc-600">{status}</p>
        </div>
        <p className="text-sm font-semibold text-amber-700">{progress}%</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70 skeleton-shimmer">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 animate-progress-grow" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
