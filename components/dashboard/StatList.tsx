type StatListItem = {
  label: string;
  value: string;
};

export function StatList({ stats }: { stats: StatListItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-3xl border border-slate-300/45 bg-white/90 p-5 card-lift">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{stat.label}</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 sm:text-3xl">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
