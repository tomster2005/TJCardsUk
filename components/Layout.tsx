import type { ReactNode } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { CartDrawer } from "@/components/CartDrawer";
import { FlyToCartLayer } from "@/components/FlyToCart";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--vault-bg)", color: "#1c1917" }}>
      <SiteNav />
      <CartDrawer />
      <FlyToCartLayer />
      <main className="relative mx-auto w-full max-w-[116rem] flex-1 px-3 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-10 xl:px-14">
        {children}
      </main>
      <footer className="border-t border-[rgba(0,0,0,0.06)] bg-white/60 px-6 py-5">
        <div className="mx-auto flex max-w-[116rem] flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-zinc-400">&copy; {new Date().getFullYear()} Collectra. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-[12px] text-zinc-400 hover:text-zinc-700 transition-colors">Terms &amp; Conditions</Link>
            <Link href="/returns" className="text-[12px] text-zinc-400 hover:text-zinc-700 transition-colors">Returns Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
