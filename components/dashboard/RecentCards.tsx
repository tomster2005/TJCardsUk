type RecentCard = {
  title: string;
  subtitle: string;
  status: string;
};

export function RecentCards({ cards }: { cards: RecentCard[] }) {
  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="card-lift rounded-3xl border border-slate-300/45 bg-white/90 p-5 shadow-[0_10px_22px_rgba(15,23,42,0.07)] hover:border-amber-300/45 hover:bg-white"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-10 rounded-xl border border-amber-300/50 bg-gradient-to-b from-white to-amber-50 shadow-[0_8px_18px_rgba(200,155,60,0.2)]" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-amber-700">Recent pull</p>
                <p className="text-base font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{card.subtitle}</p>
              </div>
            </div>
            <p className="rounded-full border border-slate-300/70 bg-slate-100/80 px-3 py-1 text-xs text-zinc-700">{card.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
