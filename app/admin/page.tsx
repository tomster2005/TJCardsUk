"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Stats = {
  totalCards: number;
  publishedCards: number;
  draftCards: number;
  pendingImages: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
};

type RecentOrder = {
  id: string;
  created_at: string;
  total: number;
  status: string;
  shipping_name: string | null;
  items: any[];
};

const ACTION_CARDS = [
  {
    group: "Catalogue",
    items: [
      { title: "Cards", desc: "Review, update status and manage stock", href: "/admin/cards", icon: "🃏", primary: true },
      { title: "Add Card", desc: "Create a draft or published catalogue entry", href: "/admin/cards/new", icon: "➕" },
      { title: "Bulk Upload", desc: "Upload scanned card images in bulk", href: "/admin/bulk-upload", icon: "📤" },
      { title: "Image Queue", desc: "Review and approve community submissions", href: "/admin/image-queue", icon: "🖼️" },
    ],
  },
  {
    group: "Binders",
    items: [
      { title: "Binders", desc: "Manage official binder sets and checklists", href: "/admin/binders", icon: "📒" },
      { title: "User Binders", desc: "View all user-created binders", href: "/admin/user-binders", icon: "👤" },
      { title: "Community Images", desc: "Manage approved community card photos", href: "/admin/community-images", icon: "🌍" },
    ],
  },
  {
    group: "System",
    items: [
      { title: "Users", desc: "View registered accounts and roles", href: "/admin/users", icon: "👥" },
      { title: "Orders", desc: "View and manage all store orders", href: "/admin/reports", icon: "🧾" },
      { title: "Discount Codes", desc: "Create and manage discount codes", href: "/admin/discount-codes", icon: "🏷️" },
      { title: "Sets", desc: "Manage card set reference data", href: "/admin/sets", icon: "📦" },
    ],
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingImageCount, setPendingImageCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      const [
        totalCardsRes,
        publishedRes,
        draftRes,
        pendingImgRes,
        ordersRes,
        usersRes,
        recentOrdersRes,
      ] = await Promise.all([
        supabase.from("cards").select("*", { count: "exact", head: true }),
        supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("community_images").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("total"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id, created_at, total, status, shipping_name, items").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (ordersRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        totalCards: totalCardsRes.count ?? 0,
        publishedCards: publishedRes.count ?? 0,
        draftCards: draftRes.count ?? 0,
        pendingImages: pendingImgRes.count ?? 0,
        totalOrders: ordersRes.data?.length ?? 0,
        totalRevenue: revenue,
        totalUsers: usersRes.count ?? 0,
      });
      setPendingImageCount(pendingImgRes.count ?? 0);
      setRecentOrders(recentOrdersRes.data ?? []);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-600">Admin</p>
            <h1 className="mt-1 text-2xl font-black text-zinc-900">Control Centre</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage cards, binders, orders and users from one place.</p>
          </div>
          <Link
            href="/admin/cards/new"
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-amber-900 transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }}
          >
            + Add Card
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Cards", value: stats.totalCards, sub: `${stats.publishedCards} published · ${stats.draftCards} draft`, href: "/admin/cards" },
            { label: "Pending Images", value: stats.pendingImages, sub: "Awaiting approval", href: "/admin/image-queue", alert: stats.pendingImages > 0 },
            { label: "Total Orders", value: stats.totalOrders, sub: `£${stats.totalRevenue.toFixed(2)} revenue`, href: "/admin/reports" },
            { label: "Users", value: stats.totalUsers, sub: "Registered accounts", href: "/admin/users" },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background: s.alert ? "rgba(239,68,68,0.04)" : "white",
                borderColor: s.alert ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.08)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{s.label}</p>
              <p className={`mt-1 text-2xl font-black ${s.alert ? "text-red-600" : "text-zinc-900"}`}>{s.value}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">{s.sub}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Action cards grouped */}
      {ACTION_CARDS.map((group) => (
        <div key={group.group}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">{group.group}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                {item.href === "/admin/image-queue" && pendingImageCount > 0 && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                    {pendingImageCount > 9 ? "9+" : pendingImageCount}
                  </span>
                )}
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-bold text-zinc-900 group-hover:text-amber-700 transition-colors">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-zinc-500">{item.desc}</p>
                </div>
                <span className="mt-auto text-[11px] font-bold text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">Recent Orders</p>
            <Link href="/admin/reports" className="text-[11px] font-bold text-amber-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {recentOrders.map((order, i) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}
              >
                <div>
                  <p className="text-[13px] font-bold text-zinc-800">{order.shipping_name || "Guest"}</p>
                  <p className="text-[11px] text-zinc-400">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{Array.isArray(order.items) ? order.items.length : 0} item{order.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      background: order.status === "paid" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)",
                      color: order.status === "paid" ? "#15803d" : "#dc2626",
                      border: `1px solid ${order.status === "paid" ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}`,
                    }}
                  >
                    {order.status}
                  </span>
                  <p className="text-[13px] font-black text-zinc-900">£{Number(order.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
