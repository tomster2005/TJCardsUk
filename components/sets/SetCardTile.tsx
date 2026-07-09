import type { SetCard } from "@/lib/demo-data/sets";

type SetCardTileProps = {
  card: SetCard;
  onSelect: () => void;
  isSelected: boolean;
};

const statusStyles: Record<string, string> = {
  owned: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  missing: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  wishlist: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  duplicate: "bg-amber-400/10 text-amber-300 border-amber-400/20",
};

export function SetCardTile({ card, onSelect, isSelected }: SetCardTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[1.5rem] border p-5 text-left shadow-sm shadow-black/10 transition ${isSelected ? "border-amber-400/30 bg-zinc-900/90" : "border-white/10 bg-zinc-950/80 hover:border-amber-400/20 hover:bg-zinc-900/90"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-white">{card.title}</p>
          <p className="mt-1 text-sm text-zinc-400">{card.player}</p>
          <p className="mt-1 text-sm text-zinc-500">{card.team}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[card.status]}`}>
          {card.status === "duplicate" ? "duplicate" : card.status}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
        <span>Card #{card.number}</span>
        <span>{card.quantity > 1 ? `${card.quantity}x` : ""}</span>
      </div>
    </button>
  );
}
