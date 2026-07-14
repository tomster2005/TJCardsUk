import type {
  Card,
  CardSet,
  CollectionCard,
  UserCollection,
  WishlistItem,
} from "@/lib/models";

export type CardFilter = {
  cardIds?: string[];
  playerId?: string;
  teamId?: string;
  brandId?: string;
  setId?: string;
  parallelId?: string;
  status?: "owned" | "missing" | "wishlist";
};

export function calculateCompletion(cardSet: CardSet, ownedCardIds: string[]) {
  if (cardSet.totalCards === 0) return 0;
  const uniqueOwnedCount = new Set(cardSet.cardIds.filter((id) => ownedCardIds.includes(id))).size;
  return Math.round((uniqueOwnedCount / cardSet.totalCards) * 100);
}

export function getOwnedCards(collection: UserCollection, allCards: Card[]) {
  const ownedIds = new Set(collection.items.map((item) => item.cardId));
  return allCards.filter((card) => ownedIds.has(card.id));
}

export function getMissingCards(cardSet: CardSet, collection: UserCollection) {
  const ownedIds = new Set(collection.items.map((item) => item.cardId));
  return cardSet.cardIds.filter((cardId) => !ownedIds.has(cardId));
}

export function getWishlistCards(wishlistItems: WishlistItem[], allCards: Card[]) {
  const wishlistIds = new Set(wishlistItems.map((item) => item.cardId));
  return allCards.filter((card) => wishlistIds.has(card.id));
}

export function calculateCollectionValue(collection: UserCollection) {
  return collection.items.reduce((total, item) => total + item.estimatedValue * item.quantity, 0);
}

export function searchCards(cards: Card[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cards;

  return cards.filter((card) => {
    const searchable = [
      card.cardNumber,
      card.description,
      card.season,
      card.imageFront,
      card.imageBack,
      card.serialNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalized);
  });
}

export function filterCards(cards: Card[], filter: CardFilter) {
  return cards.filter((card) => {
    if (filter.cardIds && !filter.cardIds.includes(card.id)) return false;
    if (filter.playerId && card.playerId !== filter.playerId) return false;
    if (filter.teamId && card.teamId !== filter.teamId) return false;
    if (filter.brandId && card.brandId !== filter.brandId) return false;
    if (filter.setId && card.setId !== filter.setId) return false;
    if (filter.parallelId && card.parallelId !== filter.parallelId) return false;
    return true;
  });
}
