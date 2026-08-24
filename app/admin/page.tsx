"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatGBP } from "@/lib/currency";

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
  { title: "Add Card", desc: "Create a new card or draft", href: "/admin/cards/new", icon: "✏️", accent: "#F26A21" },
  { title: "Bulk Upload", desc: "Upload scanned card images", href: "/admin/bulk-upload", icon: "📤", accent: "#087B75" },
  { title: "Image Queue", desc: "Review and approve community submissions", href: "/admin/image-queue", icon: "🖼️", accent: "#F26A21" },
  { title: "Manage Users", desc: "View and manage registered users", href: "/admin/users", icon: "👥", accent: "#087B75" },
  { title: "Catalogue", desc: "Manage your card catalogue and sets", href: "/admin/cards", icon: "🃏", accent: "#F26A21" },
  { title: "Binders", desc: "Manage binder sets and checklists", href: "/admin/binders", icon: "📒", accent: "#087B75" },
  { title: "Orders", desc: "View and process customer orders", href: "/admin/reports", icon: "🧾", accent: "#F26A21" },
  { title: "Settings", desc: "Configure system and preferences", href: "/admin/settings", icon: "⚙️", accent: "#087B75" },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingImageCount, setPendingImageCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      const [totalCardsRes, publishedRes, draftRes, pendingImgRes, ordersRes, usersRes, recentOrdersRes] = await Promise.all([
        supabase.from("cards").select("*", { count: "exact", head: true }),
        supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("community_images").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("total"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id, created_at, total, status, shipping_name, items").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (ordersRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
      setStats({ totalCards: totalCardsRes.count ?? 0, publishedCards: publishedRes.count ?? 0, draftCards: draftRes.count ?? 0, pendingImages: pendingImgRes.count ?? 0, totalOrders: ordersRes.data?.length ?? 0, totalRevenue: revenue, totalUsers: usersRes.count ?? 0 });
      setPendingImageCount(pendingImgRes.count ?? 0);
      setRecentOrders(recentOrdersRes.data ?? []);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">

      {/* Header panel */}
      <div className="relative overflow-hidden rounded-3xl p-7" style={{ background: "#FBF8F2" }}>
        <div className="pointer-events-none absolute -top-12 right-12 h-40 w-40 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(8,123,117,0.5), transparent 70%)", filter: "blur(32px)" }} />
        <div className="pointer-events-none absolute -bottom-8 right-1/3 h-32 w-32 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(242,106,33,0.4), transparent 70%)", filter: "blur(24px)" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "#F26A21" }}>Admin</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-900">Admin Dashboard</h1>
            <p className="mt-1 text-[14px]" style={{ color: "rgba(0,0,0,0.45)" }}>Welcome back! Here&apos;s what&apos;s happening.</p>
          </div>
          <Link href="/admin/cards/new"
            className="flex-shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5"
            style={{ background: "#F26A21", boxShadow: "0 4px 16px rgba(242,106,33,0.35)" }}>
            + Add Card
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Cards", value: stats.totalCards, sub: `${stats.publishedCards} published · ${stats.draftCards} draft`, href: "/admin/cards", icon: "🃏" },
              { label: "Pending Images", value: stats.pendingImages, sub: "Awaiting approval", href: "/admin/image-queue", icon: "🖼️", alert: stats.pendingImages > 0 },
              { label: "Total Orders", value: stats.totalOrders, sub: formatGBP(stats.totalRevenue) + " revenue", href: "/admin/reports", icon: "🧾" },
              { label: "Users", value: stats.totalUsers, sub: "Registered accounts", href: "/admin/users", icon: "👥" },
            ].map((s) => (
              <Link key={s.label} href={s.href}
                className="rounded-2xl p-4 transition hover:-translate-y-0.5"
                style={{ background: "white", border: `1px solid ${s.alert ? "rgba(239,68,68,0.2)" : "rgba(0,0,0,0.07)"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(0,0,0,0.35)" }}>{s.label}</p>
                <p className={`mt-1 text-3xl font-black ${s.alert ? "text-red-600" : "text-zinc-900"}`}>{s.value}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>{s.sub}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.3)" }}>Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACTION_CARDS.map((item) => (
            <Link key={item.href} href={item.href}
              className="group relative flex items-start gap-4 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
              {item.href === "/admin/image-queue" && pendingImageCount > 0 && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {pendingImageCount > 9 ? "9+" : pendingImageCount}
                </span>
              )}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}>
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-white">{item.title}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.3)" }}>Recent Orders</p>
            <Link href="/admin/reports" className="text-[11px] font-bold transition" style={{ color: "#F26A21" }}>View all →</Link>
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {recentOrders.map((order, i) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                <div>
                  <p className="text-[13px] font-bold text-white">{order.shipping_name || "Guest"}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{Array.isArray(order.items) ? order.items.length : 0} item{order.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: order.status === "paid" ? "rgba(8,123,117,0.15)" : "rgba(239,68,68,0.1)", color: order.status === "paid" ? "#0BA39B" : "#dc2626", border: `1px solid ${order.status === "paid" ? "rgba(8,123,117,0.25)" : "rgba(239,68,68,0.2)"}` }}>
                    {order.status}
                  </span>
                  <p className="text-[13px] font-black text-white">£{Number(order.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
