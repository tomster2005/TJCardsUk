import { useCollection } from "@/contexts/CollectionContext";
import type { BinderPocket } from "@/lib/demo-data/binder";

type CardPocketProps = {
  pocket: BinderPocket;
  isActive: boolean;
  onSelect: (pocket: BinderPocket) => void;
};

const statusStyles: Record<string, string> = {
  owned: "border-emerald-300/40 bg-emerald-100/85 text-emerald-800",
  missing: "border-slate-300/60 bg-slate-100/85 text-zinc-700",
  wishlist: "border-sky-300/40 bg-sky-100/90 text-sky-800",
};

export function CardPocket({ pocket, isActive, onSelect }: CardPocketProps) {
  const { toggleOwned, toggleWishlist, increaseQuantity, decreaseQuantity } = useCollection();

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    toggleWishlist(pocket.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        toggleOwned(pocket.id);
        onSelect(pocket);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleOwned(pocket.id);
          onSelect(pocket);
        }
      }}
      onContextMenu={handleContextMenu}
      className={`group rounded-3xl border p-3 text-left transition-all duration-300 ${isActive ? "border-amber-300/60 shadow-lg shadow-amber-300/20" : "border-slate-300/60 hover:-translate-y-1 hover:border-amber-300/45 hover:bg-white"}`}
    >
      <div className={`rounded-[1.25rem] border p-4 ${statusStyles[pocket.status]}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]">
            #{pocket.position}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Decrease quantity for ${pocket.playerName}`}
              title="Decrease quantity"
              onClick={(event) => {
                event.stopPropagation();
                decreaseQuantity(pocket.id);
              }}
              className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold"
            >
              −
            </button>
            <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold">x{pocket.quantity}</span>
            <button
              type="button"
              aria-label={`Increase quantity for ${pocket.playerName}`}
              title="Increase quantity"
              onClick={(event) => {
                event.stopPropagation();
                increaseQuantity(pocket.id);
              }}
              className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-300/60 bg-gradient-to-br from-white via-slate-100 to-zinc-100">
          {pocket.status === "missing" ? (
            <div className="flex min-h-24 items-center justify-center text-zinc-500">
              <div className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 64 64" className="h-12 w-12 fill-current opacity-70">
                  <path d="M32 7c-10 0-18 8-18 18 0 7 4 13 10 16v10h16V41c6-3 10-9 10-16 0-10-8-18-18-18Zm0 7c6 0 11 5 11 11 0 5-3 9-8 10v3H29v-3c-5-1-8-5-8-10 0-6 5-11 11-11Z" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Missing</span>
              </div>
            </div>
          ) : (
            <div className="relative h-80">
              <img src={pocket.imageUrl} alt={`${pocket.playerName} card artwork`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-200">{pocket.cardNumber}</p>
                <p className="mt-1 text-[10px] text-zinc-300">{pocket.playerName.split(" ")[0]}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          <span>{pocket.playerName.split(" ")[0]}</span>
          {pocket.wishlist ? (
            <span className="rounded-full border border-sky-300/40 bg-sky-100/85 px-2 py-1 text-[10px] text-sky-800" title="Wishlist card">
              ★ Wishlist
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
