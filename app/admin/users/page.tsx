"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatGBP } from "@/lib/currency";

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  created_at: string;
  orderCount: number;
  totalSpent: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    (async () => {
      // Fetch profiles + aggregate order data in parallel
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id, username, role, created_at").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total"),
      ]);

      const profiles = profilesRes.data ?? [];
      const orders = ordersRes.data ?? [];

      // Build order stats per user
      const statsMap = new Map<string, { count: number; total: number }>();
      for (const order of orders) {
        if (!order.user_id) continue;
        const existing = statsMap.get(order.user_id) ?? { count: 0, total: 0 };
        statsMap.set(order.user_id, {
          count: existing.count + 1,
          total: existing.total + Number(order.total ?? 0),
        });
      }

      // Fetch emails via the get_email_by_username RPC isn't ideal here —
      // instead use the profiles join with auth.users via the admin view
      // For now we show what we have and note email requires service role
      const rows: UserRow[] = profiles.map((p: any) => {
        const stats = statsMap.get(p.id) ?? { count: 0, total: 0 };
        return {
          id: p.id,
          username: p.username ?? null,
          email: null, // requires service role — shown as N/A
          role: p.role ?? "user",
          created_at: p.created_at,
          orderCount: stats.count,
          totalSpent: stats.total,
        };
      });

      setUsers(rows);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.username ?? "").toLowerCase().includes(q) || u.id.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold text-zinc-900">Users</h1>
        <p className="mt-2 text-sm text-zinc-600">{users.length} registered account{users.length !== 1 ? "s" : ""}.</p>
      </div>

      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username..."
          className="w-full max-w-sm rounded-xl border border-slate-300/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-300"
        />

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">No users found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-4">Username</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3 pr-4">Orders</th>
                  <th className="pb-3">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-zinc-900">{user.username ?? <span className="text-zinc-400">No username</span>}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">{user.id.slice(0, 8)}...</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500 text-[12px]">
                      {new Date(user.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-zinc-800">{user.orderCount}</td>
                    <td className="py-3 font-bold text-zinc-900">{formatGBP(user.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
