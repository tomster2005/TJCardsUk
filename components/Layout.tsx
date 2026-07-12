import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";
import { CartDrawer } from "@/components/CartDrawer";
import { FlyToCartLayer } from "@/components/FlyToCart";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--vault-bg)", color: "#1c1917" }}>
      <SiteNav />
      <CartDrawer />
      <FlyToCartLayer />
      <main className="relative mx-auto w-full max-w-[116rem] px-4 pb-20 pt-8 sm:px-6 lg:px-10 xl:px-14">
        {children}
      </main>
    </div>
  );
}
