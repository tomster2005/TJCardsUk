import type { BinderPocket } from "@/lib/demo-data/binder";

export type CollectionSummary = {
  totalCards: number;
  ownedCount: number;
  missingCount: number;
  wishlistCount: number;
  completion: number;
};

export function getCollectionSummary(items: BinderPocket[]): CollectionSummary {
  const totalCards = items.length;
  const ownedCount = items.filter((item) => item.owned).length;
  const missingCount = items.filter((item) => !item.owned).length;
  const wishlistCount = items.filter((item) => item.wishlist).length;
  const completion = totalCards === 0 ? 0 : Math.round((ownedCount / totalCards) * 100);

  return {
    totalCards,
    ownedCount,
    missingCount,
    wishlistCount,
    completion,
  };
}

export function getMissingItems(items: BinderPocket[]) {
  return items.filter((item) => !item.owned);
}

export function getWishlistItems(items: BinderPocket[]) {
  return items.filter((item) => item.wishlist);
}

export function getOwnedItems(items: BinderPocket[]) {
  return items.filter((item) => item.owned);
}
