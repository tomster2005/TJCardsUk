"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BookIcon, CartIcon, GridIcon, SearchIcon } from "@/components/ui/icons";
import { useCart } from "@/contexts/CartContext";

export function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const [cartBadgeAnimated, setCartBadgeAnimated] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut, isAdmin } = useAuth();
  const { itemCount, addEventCount, openCart } = useCart();

  useEffect(() => {
    if (addEventCount === 0) return;
    setCartBadgeAnimated(true);
    const t = window.setTimeout(() => setCartBadgeAnimated(false), 500);
    return () => window.clearTimeout(t);
  }, [addEventCount]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const primaryNav = [
    { href: "/dashboard", label: "Vault", icon: <GridIcon className="h-3.5 w-3.5" /> },
    { href: "/catalogue", label: "Browse", icon: <SearchIcon className="h-3.5 w-3.5" /> },
    { href: "/binder", label: "Binder", icon: <BookIcon className="h-3.5 w-3.5" /> },
  ];

  const secondaryNav = [
    { href: "/discover", label: "Discover", desc: "Explore sets & players" },
    { href: "/missing-cards", label: "Missing", desc: "Complete your sets" },
    { href: "/profile", label: "Profile", desc: "Your collector identity" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", desc: "Manage the vault" }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const linkClass = (active: boolean) =>
    `nav-link relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-150 ${
      active
        ? "is-active"
        : ""
    }`;

  const activeLinkStyle = { color: "#F26A21", background: "rgba(242,106,33,0.1)", border: "1px solid rgba(242,106,33,0.2)" };
  const inactiveLinkStyle = { color: "rgba(255,255,255,0.55)", border: "1px solid transparent" };

  return (
    <header className="sticky top-0 z-40" style={{ background: "#0D1212", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="mx-auto flex max-w-[116rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-10 xl:px-14">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-black text-white animate-soft-pulse transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #F5854A, #F26A21)", boxShadow: "0 4px 20px rgba(242,106,33,0.35)" }}
          >
            C
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-bold tracking-[0.05em] text-white font-display">Collectra</span>
            <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: "rgba(242,106,33,0.7)" }}>The Vault</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(isActive(item.href))}
              style={isActive(item.href) ? activeLinkStyle : inactiveLinkStyle}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="mx-2 h-4 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Cart */}
          <button
            type="button"
            data-cart-icon
            onClick={openCart}
            className="nav-link relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-150"
            style={{ color: "rgba(255,255,255,0.55)", border: "1px solid transparent" }}
          >
            <CartIcon className="h-3.5 w-3.5" />
            Cart
            {itemCount > 0 && (
              <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${cartBadgeAnimated ? "animate-cart-bump" : ""}`}
                style={{ background: "#F26A21", boxShadow: "0 2px 8px rgba(242,106,33,0.5)" }}>
                {itemCount}
              </span>
            )}
          </button>

          {/* Menu */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-150"
              style={menuOpen
                ? { border: "1px solid rgba(242,106,33,0.3)", background: "rgba(242,106,33,0.1)", color: "#F26A21" }
                : { border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }
              }
            >
              <span className="flex flex-col gap-[3.5px]">
                <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? "-translate-y-[5px] -rotate-45" : ""}`} />
              </span>
              Menu
            </button>

            {menuOpen && (
              <div className="animate-nav-drop absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
                style={{ background: "#131a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="p-1.5">
                  {secondaryNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col rounded-xl px-3 py-2.5 transition-colors"
                      style={isActive(item.href)
                        ? { background: "rgba(242,106,33,0.1)", color: "#F26A21" }
                        : { color: "rgba(255,255,255,0.7)" }
                      }
                    >
                      <span className="text-[13px] font-semibold">{item.label}</span>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</span>
                    </Link>
                  ))}
                </div>
                <div className="p-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors"
                      style={{ color: "#f87171" }}
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      Sign in
                    </Link>
                  )}
                </div>
                <div className="p-1.5 flex gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Link href="/terms" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl px-3 py-2 text-center text-[11px] transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Terms</Link>
                  <Link href="/returns" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl px-3 py-2 text-center text-[11px] transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>Returns</Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile: Cart + Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            data-cart-icon
            onClick={openCart}
            aria-label="Open cart"
            className="relative inline-flex items-center justify-center rounded-xl p-2 active:scale-95 touch-manipulation"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
          >
            <CartIcon className="h-4 w-4" />
            {itemCount > 0 && (
              <span className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${cartBadgeAnimated ? "animate-cart-bump" : ""}`}
                style={{ background: "#F26A21", boxShadow: "0 2px 8px rgba(242,106,33,0.5)" }}>
                {itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            className="relative z-50 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium active:scale-95 touch-manipulation"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
          >
            <span className="flex flex-col gap-[3.5px]">
              <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu — fixed overlay so it appears wherever you are on the page */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          {/* Drawer from right */}
          <div
            className="absolute right-0 top-0 h-full w-72 overflow-y-auto py-4 px-4"
            style={{ background: "#131a1a", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-0.5">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all"
                  style={isActive(item.href) ? activeLinkStyle : inactiveLinkStyle}
                >
                  {item.icon}{item.label}
                </Link>
              ))}
              <div className="my-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              {secondaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all"
                  style={isActive(item.href) ? activeLinkStyle : inactiveLinkStyle}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              {user
                ? <button onClick={() => signOut()} className="rounded-xl px-3.5 py-2 text-left text-[13px] font-medium" style={{ color: "#f87171" }}>Sign out</button>
                : <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl px-3.5 py-2 text-[13px] font-medium" style={inactiveLinkStyle}>Sign in</Link>
              }
              <div className="my-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex gap-2 px-1">
                <Link href="/terms" onClick={() => setMobileOpen(false)} className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Terms &amp; Conditions</Link>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                <Link href="/returns" onClick={() => setMobileOpen(false)} className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Returns Policy</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
