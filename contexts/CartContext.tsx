"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type CartItem = {
  id: string;
  cardId: string;
  playerName: string;
  cardNumber: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  availableQuantity?: number;
};

export type CartState = {
  items: CartItem[];
  addToCart: (card: { id: string; playerName: string; cardNumber: string; price: number; imageUrl?: string; availableQuantity?: number }) => void;
  removeFromCart: (cardId: string) => void;
  increaseQuantity: (cardId: string) => void;
  decreaseQuantity: (cardId: string) => void;
  clearCart: () => void;
  getItemQuantity: (cardId: string) => number;
  subtotal: number;
  estimatedTax: number;
  estimatedShipping: null;
  grandTotal: number;
  totalPrice: number;
  itemCount: number;
  recentlyAddedName: string | null;
  addEventCount: number;
  clearRecentlyAdded: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartState | undefined>(undefined);
const CART_KEY = (userId: string | null) => `collectra_cart_v2_${userId ?? "guest"}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [recentlyAddedName, setRecentlyAddedName] = useState<string | null>(null);
  const [addEventCount, setAddEventCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Load cart from localStorage whenever the user changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(CART_KEY(userId));
    if (!raw) { setItems([]); return; }
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(
          parsed.filter(
            (item) =>
              typeof item.cardId === "string" &&
              typeof item.playerName === "string" &&
              typeof item.cardNumber === "string" &&
              typeof item.price === "number" &&
              typeof item.quantity === "number" &&
              (typeof item.availableQuantity === "number" || typeof item.availableQuantity === "undefined"),
          ),
        );
      }
    } catch {
      window.localStorage.removeItem(CART_KEY(userId));
      setItems([]);
    }
  }, [userId]);

  // Persist cart to localStorage scoped to the current user
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_KEY(userId), JSON.stringify(items));
  }, [items, userId]);

  const addToCart = useCallback((card: { id: string; playerName: string; cardNumber: string; price: number; imageUrl?: string; availableQuantity?: number }) => {
    let added = false;
    setItems((current) => {
      const existing = current.find((item) => item.cardId === card.id);
      const hasStockCap = typeof card.availableQuantity === "number";

      if (existing) {
        if (hasStockCap && existing.quantity >= (card.availableQuantity as number)) return current;
        added = true;
        return current.map((item) =>
          item.cardId === card.id
            ? { ...item, quantity: item.quantity + 1, availableQuantity: hasStockCap ? card.availableQuantity : item.availableQuantity }
            : item,
        );
      }

      if (hasStockCap && (card.availableQuantity as number) <= 0) return current;

      added = true;
      return [
        ...current,
        {
          id: `${card.id}-${Date.now()}`,
          cardId: card.id,
          playerName: card.playerName,
          cardNumber: card.cardNumber,
          price: card.price,
          imageUrl: card.imageUrl,
          quantity: 1,
          availableQuantity: hasStockCap ? card.availableQuantity : undefined,
        },
      ];
    });

    if (added) {
      setRecentlyAddedName(card.playerName);
      setAddEventCount((current) => current + 1);
    }
  }, []);

  const removeFromCart = useCallback((cardId: string) => {
    setItems((current) => current.filter((item) => item.cardId !== cardId));
  }, []);

  const increaseQuantity = useCallback((cardId: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.cardId !== cardId) return item;
        if (typeof item.availableQuantity === "number" && item.quantity >= item.availableQuantity) return item;
        return { ...item, quantity: item.quantity + 1 };
      }),
    );
  }, []);

  const decreaseQuantity = useCallback((cardId: string) => {
    setItems((current) =>
      current
        .map((item) => (item.cardId === cardId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getItemQuantity = useCallback(
    (cardId: string) => items.find((item) => item.cardId === cardId)?.quantity ?? 0,
    [items],
  );

  const clearRecentlyAdded = useCallback(() => setRecentlyAddedName(null), []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const estimatedTax = 0;
  const estimatedShipping = null;
  const grandTotal = subtotal;
  const totalPrice = subtotal;

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      getItemQuantity,
      subtotal,
      estimatedTax,
      estimatedShipping,
      grandTotal,
      totalPrice,
      itemCount,
      recentlyAddedName,
      addEventCount,
      clearRecentlyAdded,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      getItemQuantity,
      subtotal,
      estimatedTax,
      estimatedShipping,
      grandTotal,
      totalPrice,
      itemCount,
      recentlyAddedName,
      addEventCount,
      clearRecentlyAdded,
      isCartOpen,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
