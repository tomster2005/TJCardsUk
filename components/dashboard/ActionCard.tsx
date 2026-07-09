type ActionCardProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export function ActionCard({ title, description, actionLabel }: ActionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/45 bg-[radial-gradient(circle_at_top,_rgba(245,210,132,0.32),_transparent_50%),linear-gradient(140deg,_rgba(255,255,255,0.96),_rgba(252,246,233,0.95))] p-7 shadow-[0_18px_45px_rgba(200,155,60,0.2)] card-lift">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-amber-200/20 to-transparent" />
      <p className="text-xs uppercase tracking-[0.32em] text-amber-700">Next best action</p>
      <h2 className="mt-4 text-2xl font-semibold text-zinc-900 sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      <button className="mt-6 inline-flex rounded-full border border-amber-500/35 bg-amber-400/15 px-6 py-3 text-sm font-semibold text-amber-900 shadow-[0_10px_28px_rgba(200,155,60,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300/25 hover:shadow-[0_14px_32px_rgba(200,155,60,0.25)]">
        {actionLabel}
      </button>
    </div>
  );
}
