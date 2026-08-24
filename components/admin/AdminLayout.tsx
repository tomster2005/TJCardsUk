"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchIcon } from "@/components/ui/icons";

const adminNavGroups = [
  {
    title: "Overview",
    key: "overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "⊞" }],
  },
  {
    title: "Catalogue",
    key: "catalogue",
    items: [
      { href: "/admin/cards", label: "Cards", icon: "🃏" },
      { href: "/admin/cards/new", label: "Add Card", icon: "➕" },
      { href: "/admin/bulk-upload", label: "Bulk Upload", icon: "📤" },
      { href: "/admin/image-queue", label: "Image Queue", icon: "🖼️" },
      { href: "/admin/binders", label: "Binders", icon: "📒" },
      { href: "/admin/user-binders", label: "User Binders", icon: "👤" },
      { href: "/admin/community-images", label: "Community Images", icon: "🌍" },
    ],
  },
  {
    title: "Database",
    key: "database",
    items: [
      { href: "/admin/sets", label: "Sets", icon: "📦" },
      { href: "/admin/players", label: "Players", icon: "👤" },
      { href: "/admin/teams", label: "Teams", icon: "🏟️" },
    ],
  },
  {
    title: "System",
    key: "system",
    items: [
      { href: "/admin/users", label: "Users", icon: "👥" },
      { href: "/admin/reports", label: "Orders", icon: "🧾" },
      { href: "/admin/discount-codes", label: "Discount Codes", icon: "🏷️" },
      { href: "/admin/storage", label: "Storage", icon: "📦" },
      { href: "/admin/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, loading, isAdmin, role, profileLoading } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of adminNavGroups) {
      initial[group.key] = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      );
    }
    return initial;
  });

  const authReady = !loading && !profileLoading;

  useEffect(() => {
    if (!authReady) return;
    if (!user) router.push("/login");
    else if (role !== null && role !== "admin") router.push("/dashboard");
  }, [authReady, user, role, router]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0D1212" }}>
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[rgba(242,106,33,0.2)] border-t-[#F26A21]" />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Checking access…</p>
        </div>
      </div>
    );
  }

  if (!user || (role !== null && role !== "admin")) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen" style={{ background: "#0D1212" }}>

      {/* Sidebar */}
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
              <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(242,106,33,0.6)" }}>Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {adminNavGroups.map((group) => (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => setOpenGroups((cur) => ({ ...cur, [group.key]: !cur[group.key] }))}
                className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] transition"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {group.title}
                <span>{openGroups[group.key] ? "−" : "+"}</span>
              </button>
              {openGroups[group.key] && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-150"
                        style={active
                          ? { background: "rgba(242,106,33,0.12)", color: "#F26A21", borderLeft: "2px solid #F26A21" }
                          : { color: "rgba(255,255,255,0.5)", borderLeft: "2px solid transparent" }
                        }
                      >
                        <span className="text-sm">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 pt-3 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium transition"
            style={{ color: "rgba(255,255,255,0.5)", borderLeft: "2px solid transparent" }}>
            ← View Public Site
          </Link>
          <Link href="/profile"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium transition"
            style={{ color: "rgba(255,255,255,0.5)", borderLeft: "2px solid transparent" }}>
            👤 Profile
          </Link>
          <button onClick={() => signOut()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium transition"
            style={{ color: "rgba(248,113,113,0.7)", borderLeft: "2px solid transparent" }}>
            ↩ Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-[200px]">

        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-4 px-6 py-3"
          style={{ background: "#0D1212", borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: "60px" }}>

          {/* Mobile logo */}
          <Link href="/admin" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-black text-white"
              style={{ background: "linear-gradient(135deg, #F5854A, #F26A21)" }}>C</span>
            <span className="text-[14px] font-bold text-white">Admin</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input type="text" placeholder="Search cards, players, users..."
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                readOnly />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="hidden sm:block text-[12px] transition" style={{ color: "rgba(255,255,255,0.4)" }}>← View Public Site</Link>
            <Link href="/profile" className="hidden sm:block text-[12px] transition" style={{ color: "rgba(255,255,255,0.4)" }}>Profile</Link>
            <button onClick={() => signOut()}
              className="rounded-xl px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90"
              style={{ background: "#F26A21", boxShadow: "0 4px 12px rgba(242,106,33,0.3)" }}>
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
