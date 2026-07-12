"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const topNavItems = [{ href: "/", label: "← View Public Site" }, { href: "/profile", label: "Profile" }];

const adminNavGroups = [
  {
    title: "Overview",
    key: "overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    title: "Catalogue",
    key: "catalogue",
    items: [
      { href: "/admin/cards", label: "Cards" },
      { href: "/admin/cards/new", label: "Add Card" },
      { href: "/admin/bulk-upload", label: "Bulk Upload" },
      { href: "/admin/image-queue", label: "Image Queue" },
      { href: "/admin/binders", label: "Binders" },
      { href: "/admin/community-images", label: "Community Images" },
    ],
  },
  {
    title: "Database",
    key: "database",
    items: [
      { href: "/admin/sets", label: "Sets" },
      { href: "/admin/teams", label: "Teams" },
      { href: "/admin/players", label: "Players" },
    ],
  },
  {
    title: "System",
    key: "system",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, loading, isAdmin, profileLoading } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    catalogue: true,
    database: true,
    system: true,
  });

  const authReady = !loading && !profileLoading;

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [authReady, user, isAdmin, router]);

  // Show loading while auth + profile are resolving
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm text-zinc-500">Checking access…</p>
        </div>
      </div>
    );
  }

  // Don't render admin content for non-admin users (redirect is in progress)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(200,155,60,0.18),_transparent_35%),linear-gradient(150deg,_#fcfbf8_0%,_#f6f2e9_100%)] text-zinc-800">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/45 bg-amber-100/90 text-sm font-semibold text-amber-900">
              C
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-900">Collectra</p>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Admin</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {topNavItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`rounded-full px-3 py-2 transition ${isActive ? "bg-amber-100/90 text-amber-900" : "hover:bg-white hover:text-zinc-900"}`}>
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={() => signOut()} className="rounded-full border border-slate-300/80 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-amber-300/60 hover:text-zinc-900">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:px-8">
        <aside className="w-full rounded-[2rem] border border-slate-300/55 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.09)] lg:w-72">
          <div className="rounded-[1.5rem] border border-slate-300/55 bg-[#f8f4ea]/95 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Admin tools</p>
            <h2 className="mt-3 text-xl font-semibold text-zinc-900">Collectra control center</h2>
            <p className="mt-2 text-sm text-zinc-600">Manage cards, publishing, and reference data from one workspace.</p>
          </div>

          <nav className="mt-4 space-y-3">
            {adminNavGroups.map((group) => {
              const isGroupActive = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
              const isOpen = openGroups[group.key];

              return (
                <div key={group.key} className="rounded-2xl border border-slate-300/60 bg-white/80 p-2">
                  <button
                    type="button"
                    onClick={() => setOpenGroups((cur) => ({ ...cur, [group.key]: !cur[group.key] }))}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] ${isGroupActive ? "text-amber-800" : "text-zinc-500"}`}
                  >
                    <span>{group.title}</span>
                    <span className="text-zinc-500">{isOpen ? "-" : "+"}</span>
                  </button>

                  {isOpen ? (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <Link key={item.href} href={item.href} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-amber-100/95 text-amber-900" : "text-zinc-700 hover:bg-slate-100 hover:text-zinc-900"}`}>
                            <span>{item.label}</span>
                            <span className="text-xs uppercase tracking-[0.25em] text-zinc-500">&gt;</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
