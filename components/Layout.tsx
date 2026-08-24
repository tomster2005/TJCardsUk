"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { FlyToCartLayer } from "@/components/FlyToCart";
import { GridIcon, SearchIcon, BookIcon, CartIcon, LayersIcon, MissingIcon, ProfileIcon } from "@/components/ui/icons";


const sidebarNav = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/catalogue", label: "Browse", icon: SearchIcon },
  { href: "/binder", label: "Binder", icon: BookIcon },
  { href: "/discover", label: "Sets", icon: LayersIcon },
  { href: "/missing-cards", label: "Missing Cards", icon: MissingIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, role } = useAuth();
  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="hidden lg:flex flex-col w-[200px] shrink-0 fixed top-0 left-0 h-screen z-30 overflow-y-auto"
      style={{ background: "#0D1212", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #F5854A, #F26A21)", boxShadow: "0 4px 16px rgba(242,106,33,0.4)" }}>
            C
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-white">Collectra</span>
            <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(242,106,33,0.6)" }}>The Vault</span>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {sidebarNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
              style={active
                ? { background: "rgba(242,106,33,0.12)", color: "#F26A21", borderLeft: "2px solid #F26A21" }
                : { color: "rgba(255,255,255,0.5)", borderLeft: "2px solid transparent" }
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {role === "admin" && (
          <Link href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
            style={isActive("/admin")
              ? { background: "rgba(242,106,33,0.12)", color: "#F26A21", borderLeft: "2px solid #F26A21" }
              : { color: "rgba(255,255,255,0.5)", borderLeft: "2px solid transparent" }
            }
          >
            <GridIcon className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

    </aside>
  );
}

function TopBar() {
  const pathname = usePathname();
  const { itemCount, openCart, addEventCount } = useCart();
  const [cartBadgeAnimated, setCartBadgeAnimated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (addEventCount === 0) return;
    setCartBadgeAnimated(true);
    const t = window.setTimeout(() => setCartBadgeAnimated(false), 500);
    return () => window.clearTimeout(t);
  }, [addEventCount]);

  const { user, signOut, isAdmin } = useAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const mobileNav = [
    { href: "/dashboard", label: "Dashboard", icon: GridIcon },
    { href: "/catalogue", label: "Browse", icon: SearchIcon },
    { href: "/binder", label: "Binder", icon: BookIcon },
    { href: "/discover", label: "Sets", icon: LayersIcon },
    { href: "/missing-cards", label: "Missing Cards", icon: MissingIcon },
    { href: "/profile", label: "Profile", icon: ProfileIcon },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: GridIcon }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 sm:px-6"
        style={{ background: "#0D1212", borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: "60px" }}>

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #F5854A, #F26A21)" }}>C</span>
          <span className="text-[14px] font-bold text-white">Collectra</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              type="text"
              placeholder="Search cards, players, sets..."
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
              readOnly
              onClick={() => { window.location.href = "/catalogue"; }}
            />
          </div>
        </div>

        {/* Desktop nav — Cart only */}
        <div className="hidden lg:flex items-center ml-auto">
          <button type="button" data-cart-icon onClick={openCart}
            className="relative inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-150"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <CartIcon className="h-3.5 w-3.5" />
            Cart
            {itemCount > 0 && (
              <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${cartBadgeAnimated ? "animate-cart-bump" : ""}`}
                style={{ background: "#F26A21" }}>
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile right */}
        <div className="flex items-center gap-2 lg:hidden ml-auto">
          <button type="button" data-cart-icon onClick={openCart}
            className="relative inline-flex items-center justify-center rounded-xl p-2"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
          >
            <CartIcon className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
                style={{ background: "#F26A21" }}>
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={() => setMobileOpen(v => !v)}
            className="inline-flex items-center justify-center rounded-xl p-2"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
          >
            <span className="flex flex-col gap-[3.5px]">
              <span className={`block h-[1.5px] w-4 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`block h-[1.5px] w-4 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[1.5px] w-4 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden px-4 py-3 space-y-0.5 animate-nav-drop"
          style={{ background: "#131a1a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {mobileNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all"
                style={active
                  ? { background: "rgba(242,106,33,0.12)", color: "#F26A21" }
                  : { color: "rgba(255,255,255,0.55)" }
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {user
              ? <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium" style={{ color: "rgba(248,113,113,0.7)" }}>Sign out</button>
              : <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Sign in</Link>
            }
          </div>
        </div>
      )}
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#0D1212" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-[200px]">
        <TopBar />
        <CartDrawer />
        <FlyToCartLayer />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 pb-8">
          {children}
        </main>
        <footer className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>© {new Date().getFullYear()} Collectra. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Terms &amp; Conditions</Link>
              <Link href="/returns" className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Returns Policy</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
