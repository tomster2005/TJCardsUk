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
  const [cartBadgeAnimated, setCartBadgeAnimated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
    `nav-link relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-250 ${
      active
        ? "is-active text-[#92400e] bg-[rgba(200,155,60,0.12)] border border-[rgba(200,155,60,0.3)]"
        : "text-zinc-500 hover:text-zinc-800 hover:bg-[rgba(0,0,0,0.04)] border border-transparent"
    }`;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-400 ${
        scrolled
          ? "bg-white/95 backdrop-blur-2xl border-b border-[rgba(0,0,0,0.08)] shadow-[0_1px_0_rgba(200,155,60,0.1),0_4px_24px_rgba(0,0,0,0.06)]"
          : "bg-[rgba(248,246,242,0.85)] backdrop-blur-xl border-b border-[rgba(0,0,0,0.05)]"
      }`}
    >
      <div className="mx-auto flex max-w-[116rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-10 xl:px-14">

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5d97a] via-[#c89b3c] to-[#a07828] text-[13px] font-black text-[#1a0e00] shadow-[0_4px_20px_rgba(200,155,60,0.4)] animate-soft-pulse transition-all duration-300 group-hover:shadow-[0_6px_28px_rgba(200,155,60,0.6)]">
            C
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-bold tracking-[0.05em] text-zinc-800 font-display">Collectra</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[rgba(200,155,60,0.8)]">The Vault</span>
          </div>
        </Link>

        {/* ── Desktop Nav ──────────────────────────────────────────────── */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="mx-2 h-4 w-px bg-[rgba(0,0,0,0.1)]" />

          {/* Cart */}
            <button
            type="button"
            data-cart-icon
            onClick={openCart}
            className="nav-link relative inline-flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-2 text-[13px] font-medium text-zinc-500 transition-all duration-250 hover:border-[rgba(0,0,0,0.08)] hover:bg-[rgba(0,0,0,0.04)] hover:text-zinc-800"
          >
            <CartIcon className="h-3.5 w-3.5" />
            Cart
            {itemCount > 0 && (
              <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#f5d97a] to-[#c89b3c] px-1 text-[10px] font-bold text-[#0d0d0f] shadow-[0_2px_8px_rgba(200,155,60,0.5)] ${cartBadgeAnimated ? "animate-cart-bump" : ""}`}>
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
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all duration-250 ${
                menuOpen
                  ? "border-[rgba(200,155,60,0.4)] bg-[rgba(200,155,60,0.1)] text-[#92400e]"
                  : "border-[rgba(0,0,0,0.1)] bg-white text-zinc-600 hover:border-[rgba(0,0,0,0.15)] hover:bg-[rgba(0,0,0,0.03)] hover:text-zinc-900"
              }`}
            >
              <span className="flex flex-col gap-[3.5px]">
                <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? "translate-y-[2.5px] rotate-45" : ""}`} />
                <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${menuOpen ? "-translate-y-[2.5px] -rotate-45" : ""}`} />
              </span>
              Menu
            </button>

            {menuOpen && (
              <div className="animate-nav-drop absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
                <div className="p-1.5">
                  {secondaryNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex flex-col rounded-xl px-3 py-2.5 transition-colors ${
                        isActive(item.href)
                          ? "bg-[rgba(200,155,60,0.1)] text-[#92400e]"
                          : "text-zinc-700 hover:bg-[rgba(0,0,0,0.04)] hover:text-zinc-900"
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{item.label}</span>
                      <span className="text-[11px] text-zinc-400">{item.desc}</span>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-[rgba(0,0,0,0.06)] p-1.5">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-zinc-900"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ── Mobile Toggle ─────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
          className="relative z-50 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2 text-sm font-medium text-zinc-600 md:hidden active:scale-95 touch-manipulation"
        >
          <span className="flex flex-col gap-[3.5px]">
            <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "translate-y-[2.5px] rotate-45" : ""}`} />
            <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[1.5px] w-3.5 rounded-full bg-current transition-all duration-200 ${mobileOpen ? "-translate-y-[2.5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="animate-nav-drop border-t border-[rgba(0,0,0,0.06)] bg-white/97 px-4 py-3 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-0.5">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))} onClick={() => setMobileOpen(false)}>
                {item.icon}{item.label}
              </Link>
            ))}
            <button type="button" onClick={() => { setMobileOpen(false); openCart(); }} className={linkClass(false)}>
              <CartIcon className="h-3.5 w-3.5" />Cart
              {itemCount > 0 && <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#c89b3c] text-[10px] font-bold text-[#0d0d0f]">{itemCount}</span>}
            </button>
            <div className="my-2 h-px bg-[rgba(0,0,0,0.06)]" />
            {secondaryNav.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-[rgba(0,0,0,0.06)]" />
            {user
              ? <button onClick={() => signOut()} className="rounded-full px-3.5 py-2 text-left text-[13px] font-medium text-rose-600">Sign out</button>
              : <Link href="/login" className={linkClass(false)} onClick={() => setMobileOpen(false)}>Sign in</Link>
            }
          </div>
        </div>
      )}
    </header>
  );
}
