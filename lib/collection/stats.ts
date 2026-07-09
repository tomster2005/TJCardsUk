import type { CollectionEntry, CollectionStats } from "@/lib/collection/types";

export function computeCollectionStats(entries: CollectionEntry[], publishedCardCount: number): CollectionStats {
  const totalCards = entries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const uniqueCards = new Set(entries.map((entry) => entry.card_id)).size;
  const collectionValue = entries.reduce((sum, entry) => {
    const fallback = Number(entry.cards?.price ?? entry.cards?.estimated_value ?? 0);
    const unitValue = Number(entry.estimated_value ?? fallback);
    return sum + unitValue * Number(entry.quantity || 0);
  }, 0);

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyAdded = entries.filter((entry) => new Date(entry.date_added).getTime() >= oneWeekAgo).length;
  const completionPct = publishedCardCount > 0 ? Math.min(100, Math.round((uniqueCards / publishedCardCount) * 100)) : 0;

  const highest = [...entries].sort((a, b) => {
    const left = Number(a.estimated_value ?? a.cards?.price ?? 0) * Number(a.quantity || 0);
    const right = Number(b.estimated_value ?? b.cards?.price ?? 0) * Number(b.quantity || 0);
    return right - left;
  })[0];

  const newest = [...entries].sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())[0];

  const setCounts = new Map<string, number>();
  const playerCounts = new Map<string, number>();
  const teamCounts = new Map<string, number>();

  for (const entry of entries) {
    const qty = Number(entry.quantity || 0);
    const setName = entry.cards?.set_name || "Unknown set";
    const player = entry.cards?.player || entry.cards?.title || "Unknown player";
    const team = entry.cards?.team || "Unknown team";

    setCounts.set(setName, (setCounts.get(setName) || 0) + qty);
    playerCounts.set(player, (playerCounts.get(player) || 0) + qty);
    teamCounts.set(team, (teamCounts.get(team) || 0) + qty);
  }

  const mostCollectedSet = [...setCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const favouritePlayer = [...playerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const favouriteTeam = [...teamCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalCards,
    uniqueCards,
    collectionValue,
    recentlyAdded,
    completionPct,
    highestValueCard: highest ? highest.cards?.player || highest.cards?.title || "Unknown card" : undefined,
    newestCard: newest ? newest.cards?.player || newest.cards?.title || "Unknown card" : undefined,
    mostCollectedSet,
    favouritePlayer,
    favouriteTeam,
  };
}
