type ProgressBarProps = {
  label: string;
  progress: number;
};

export function ProgressBar({ label, progress }: ProgressBarProps) {
  return (
    <div className="rounded-3xl border border-slate-300/45 bg-white/90 p-6 card-lift">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">{label}</p>
        <p className="text-sm font-semibold text-amber-700">{progress}%</p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/70 skeleton-shimmer">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 transition-all duration-700 animate-progress-grow"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
