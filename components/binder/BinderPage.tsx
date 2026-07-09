import type { BinderPocket } from "@/lib/demo-data/binder";
import { CardPocket } from "./CardPocket";

type BinderPageProps = {
  pockets: BinderPocket[];
  activePocketId?: string;
  onSelectPocket: (pocket: BinderPocket) => void;
};

export function BinderPage({ pockets, activePocketId, onSelectPocket }: BinderPageProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pockets.map((pocket) => (
        <CardPocket
          key={pocket.id}
          pocket={pocket}
          isActive={pocket.id === activePocketId}
          onSelect={onSelectPocket}
        />
      ))}
    </div>
  );
}
