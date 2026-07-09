type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "amber" | "emerald" | "slate";
  icon?: React.ReactNode;
};

export function StatCard({ label, value, detail, tone = "slate", icon }: StatCardProps) {
  const toneClass =
    tone === "amber"
      ? "from-amber-100/90 to-orange-100/70 border-amber-300/45"
      : tone === "emerald"
        ? "from-emerald-100/85 to-teal-100/65 border-emerald-300/35"
        : "from-slate-100/95 to-white/90 border-slate-300/50";

  return (
    <div className={`card-lift group rounded-3xl border bg-gradient-to-br ${toneClass} p-7 shadow-[0_18px_36px_rgba(15,23,42,0.08)]`}>
      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
        {icon ? <span className="text-zinc-600 transition-transform duration-300 group-hover:scale-110">{icon}</span> : null}
        <p>{label}</p>
      </div>
      <p className="mt-4 text-4xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{detail}</p>
    </div>
  );
}
