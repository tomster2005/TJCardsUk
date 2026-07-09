"use client";

import { useMemo, useState } from "react";
import { SetCardDetailsPanel } from "@/components/sets/SetCardDetailsPanel";
import { SetCardTile } from "@/components/sets/SetCardTile";
import { SetDetailHeader } from "@/components/sets/SetDetailHeader";
import type { SetCard, SetDetail } from "@/lib/demo-data/sets";

type FilterKey = "all" | "owned" | "missing" | "wishlist" | "duplicates";
type SortKey = "cardNumber" | "playerName" | "team";

const filterOptions: Array<{ value: FilterKey; label: string }> = [
  { value: "all", label: "All" },
  { value: "owned", label: "Owned" },
  { value: "missing", label: "Missing" },
  { value: "wishlist", label: "Wishlist" },
  { value: "duplicates", label: "Duplicates" },
];

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "cardNumber", label: "Card Number" },
  { value: "playerName", label: "Player Name" },
  { value: "team", label: "Team" },
];

export function SetDetailsExperience({ set }: { set: SetDetail }) {
  const [cards, setCards] = useState<SetCard[]>(set.cards);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("cardNumber");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(set.cards[0]?.id ?? null);

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  const visibleCards = useMemo(() => {
    const filtered = cards.filter((card) => {
      switch (filter) {
        case "owned":
          return card.status === "owned";
        case "missing":
          return card.status === "missing";
        case "wishlist":
          return card.status === "wishlist";
        case "duplicates":
          return card.status === "duplicate";
        default:
          return true;
      }
    });

    return filtered.sort((left, right) => {
      if (sortBy === "playerName") {
        return left.player.localeCompare(right.player);
      }

      if (sortBy === "team") {
        return left.team.localeCompare(right.team);
      }

      const leftNumber = Number.parseInt(left.number, 10) || 0;
      const rightNumber = Number.parseInt(right.number, 10) || 0;
      return leftNumber - rightNumber;
    });
  }, [cards, filter, sortBy]);

  const ownedCount = cards.filter((card) => card.status === "owned" || card.status === "duplicate").length;
  const isComplete = ownedCount === cards.length;

  const toggleOwned = (cardId: string) => {
    setCards((current) =>
      current.map((card) => {
        if (card.id !== cardId) return card;

        const isOwned = card.status === "owned" || card.status === "duplicate";
        return {
          ...card,
          status: isOwned ? "missing" : "owned",
          quantity: isOwned ? Math.max(1, card.quantity) : card.quantity,
        };
      }),
    );
  };

  const toggleWishlist = (cardId: string) => {
    setCards((current) =>
      current.map((card) => {
        if (card.id !== cardId) return card;
        if (card.status === "owned" || card.status === "duplicate") {
          return card;
        }

        return {
          ...card,
          status: card.status === "wishlist" ? "missing" : "wishlist",
        };
      }),
    );
  };

  const increaseQuantity = (cardId: string) => {
    setCards((current) =>
      current.map((card) => {
        if (card.id !== cardId) return card;

        const nextQuantity = card.quantity + 1;
        return {
          ...card,
          quantity: nextQuantity,
          status: nextQuantity > 1 ? "duplicate" : card.status === "wishlist" ? "wishlist" : "owned",
        };
      }),
    );
  };

  const decreaseQuantity = (cardId: string) => {
    setCards((current) =>
      current.map((card) => {
        if (card.id !== cardId) return card;

        const nextQuantity = Math.max(1, card.quantity - 1);
        return {
          ...card,
          quantity: nextQuantity,
          status: nextQuantity > 1 ? "duplicate" : card.status === "wishlist" ? "wishlist" : card.status === "missing" ? "missing" : "owned",
        };
      }),
    );
  };

  return (
    <div className="space-y-8">
      <SetDetailHeader
        title={set.title}
        brand={set.brand}
        year={set.year}
        completion={set.completion}
        ownedCount={ownedCount}
        totalCards={set.totalCards}
        missingCards={set.totalCards - ownedCount}
      />

      <section className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30 sm:p-8">
        {isComplete ? (
          <div className="mb-6 rounded-[1.5rem] border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
                Complete set
              </span>
              <p className="text-sm font-medium">Every card in this set is now marked as owned. That is a collector milestone worth celebrating.</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Collection view</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Cards in this set</h2>
            <p className="mt-2 text-sm text-zinc-400">Filter by state, sort by card number or player, and open any card for a richer detail view.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${filter === option.value ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-zinc-900/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
              className="rounded-full border border-white/10 bg-zinc-950/90 px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-zinc-400">{visibleCards.length} cards shown</p>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {visibleCards.map((card) => (
              <SetCardTile
                key={card.id}
                card={card}
                onSelect={() => setSelectedCardId(card.id)}
                isSelected={selectedCardId === card.id}
              />
            ))}
          </div>

          <SetCardDetailsPanel
            card={selectedCard}
            onToggleOwned={() => selectedCard && toggleOwned(selectedCard.id)}
            onToggleWishlist={() => selectedCard && toggleWishlist(selectedCard.id)}
            onIncreaseQuantity={() => selectedCard && increaseQuantity(selectedCard.id)}
            onDecreaseQuantity={() => selectedCard && decreaseQuantity(selectedCard.id)}
          />
        </div>
      </section>
    </div>
  );
}
