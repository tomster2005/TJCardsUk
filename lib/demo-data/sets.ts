import type { CardSet, Card, Player, UserCollection, WishlistItem } from "@/lib/models";
import { calculateCompletion } from "@/lib/models/utils";
import { brands, cardSets, cards, players, userCollections, wishlistItems } from "./demo-data";

type SetCardStatus = "owned" | "missing" | "wishlist" | "duplicate";

export type SetCard = {
  id: string;
  title: string;
  player: string;
  team: string;
  number: string;
  status: SetCardStatus;
  quantity: number;
};

export type SetPreview = {
  id: string;
  title: string;
  brand: string;
  year: number;
  totalCards: number;
  ownedCount: number;
  completion: number;
  missingCards: number;
};

export type SetDetail = SetPreview & {
  cards: SetCard[];
};

const collection = userCollections[0];
const wishlistCardIds = new Set(wishlistItems.map((item) => item.cardId));

function getCardStatus(cardId: string, ownedCards: Set<string>): SetCardStatus {
  if (ownedCards.has(cardId)) return "owned";
  if (wishlistCardIds.has(cardId)) return "wishlist";
  return "missing";
}

function getSetCards(cardSet: CardSet, ownedCards: Set<string>): SetCard[] {
  return cardSet.cardIds.map((cardId) => {
    const card = cards.find((item) => item.id === cardId);
    const player = players.find((player) => player.id === card?.playerId)?.fullName ?? "Unknown player";

    const team = cards.find((item) => item.id === cardId)?.teamId === "team-man-city" ? "Manchester City" : "Liverpool";

    return {
      id: cardId,
      title: card ? `${cardSet.title} #${card.cardNumber}` : `Card ${cardId}`,
      player,
      team,
      number: card?.cardNumber ?? "?",
      status: getCardStatus(cardId, ownedCards),
      quantity: 1,
    };
  });
}

function transformSet(cardSet: CardSet, ownedCards:Array<string>): SetDetail {
  const ownedCardSet = new Set(ownedCards);
  const cardsInSet = getSetCards(cardSet, ownedCardSet);
  const ownedCount = cardsInSet.filter((card) => card.status === "owned").length;
  const completion = calculateCompletion(cardSet, ownedCards);
  const missingCards = cardsInSet.filter((card) => card.status !== "owned").length;

  return {
    id: cardSet.id,
    title: cardSet.title,
    brand: brands.find((brand) => brand.id === cardSet.brandId)?.name ?? "Unknown brand",
    year: cardSet.year,
    totalCards: cardSet.totalCards,
    ownedCount,
    completion,
    missingCards,
    cards: cardsInSet,
  };
}

export const discoverSets: SetPreview[] = cardSets.map((set) => {
  const transformed = transformSet(set, collection.items.map((item) => item.cardId));
  return {
    id: transformed.id,
    title: transformed.title,
    brand: transformed.brand,
    year: transformed.year,
    totalCards: transformed.totalCards,
    ownedCount: transformed.ownedCount,
    completion: transformed.completion,
    missingCards: transformed.missingCards,
  };
});

export function getSetById(setId: string): SetDetail | undefined {
  const cardSet = cardSets.find((set) => set.id === setId);
  if (!cardSet) return undefined;
  return transformSet(cardSet, collection.items.map((item) => item.cardId));
}

export function getAllSetIds() {
  return cardSets.map((set) => set.id);
}
