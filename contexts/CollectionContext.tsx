"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { binderDemoData, type BinderPocket } from "@/lib/demo-data/binder";

export type CollectionState = {
  pockets: BinderPocket[];
  toggleOwned: (pocketId: string) => void;
  toggleWishlist: (pocketId: string) => void;
  increaseQuantity: (pocketId: string) => void;
  decreaseQuantity: (pocketId: string) => void;
};

const CollectionContext = createContext<CollectionState | undefined>(undefined);

function buildInitialPockets() {
  return binderDemoData.pages.flatMap((page) => page.pockets);
}

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [pockets, setPockets] = useState<BinderPocket[]>(() => buildInitialPockets());

  const toggleOwned = (pocketId: string) => {
    setPockets((current) =>
      current.map((pocket) => {
        if (pocket.id !== pocketId) return pocket;

        const nextOwned = !pocket.owned;
        return {
          ...pocket,
          owned: nextOwned,
          status: nextOwned ? "owned" : pocket.wishlist ? "wishlist" : "missing",
        };
      }),
    );
  };

  const toggleWishlist = (pocketId: string) => {
    setPockets((current) =>
      current.map((pocket) => {
        if (pocket.id !== pocketId) return pocket;

        const nextWishlist = !pocket.wishlist;
        return {
          ...pocket,
          wishlist: nextWishlist,
          status: nextWishlist ? (pocket.owned ? "owned" : "wishlist") : pocket.owned ? "owned" : "missing",
        };
      }),
    );
  };

  const increaseQuantity = (pocketId: string) => {
    setPockets((current) => current.map((pocket) => (pocket.id === pocketId ? { ...pocket, quantity: pocket.quantity + 1 } : pocket)));
  };

  const decreaseQuantity = (pocketId: string) => {
    setPockets((current) =>
      current.map((pocket) =>
        pocket.id === pocketId && pocket.quantity > 1 ? { ...pocket, quantity: pocket.quantity - 1 } : pocket,
      ),
    );
  };

  const value = useMemo<CollectionState>(
    () => ({
      pockets,
      toggleOwned,
      toggleWishlist,
      increaseQuantity,
      decreaseQuantity,
    }),
    [pockets],
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
}
