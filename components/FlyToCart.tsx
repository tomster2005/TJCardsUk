"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type FlyingItem = {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

let flyQueue: ((item: Omit<FlyingItem, "id">) => void) | null = null;

export function triggerFlyToCart(imageUrl: string, startRect: DOMRect) {
  const cartEl = document.querySelector("[data-cart-icon]");
  if (!cartEl || !flyQueue) return;
  const cartRect = cartEl.getBoundingClientRect();
  flyQueue({
    imageUrl,
    startX: startRect.left + startRect.width / 2,
    startY: startRect.top + startRect.height / 2,
    endX: cartRect.left + cartRect.width / 2,
    endY: cartRect.top + cartRect.height / 2,
  });
}

export function FlyToCartLayer() {
  const [items, setItems] = useState<FlyingItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    flyQueue = (item) => {
      const id = `${Date.now()}-${Math.random()}`;
      setItems((prev) => [...prev, { ...item, id }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 1700);
    };
    return () => { flyQueue = null; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      {items.map((item) => (
        <FlyingCard key={item.id} item={item} />
      ))}
    </>,
    document.body
  );
}

function FlyingCard({ item }: { item: FlyingItem }) {
  const [phase, setPhase] = useState<"start" | "fly">("start");

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("fly"));
    });
  }, []);

  const isFly = phase === "fly";

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: isFly ? item.endX : item.startX,
        top: isFly ? item.endY : item.startY,
        transform: isFly
          ? "translate(-50%, -50%) scale(0.2) rotate(8deg)"
          : "translate(-50%, -50%) scale(1) rotate(0deg)",
        opacity: isFly ? 0.3 : 0.9,
        transition: "all 1500ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        className="h-20 w-14 overflow-hidden rounded-lg shadow-xl"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 text-lg">🃏</div>
        )}
      </div>
    </div>
  );
}
