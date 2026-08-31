"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatGBP } from "@/lib/currency";

const SUMUP_FEE_RATE = 0.0169;

type OrderItem = { cardId: string; playerName: string; quantity: number; price?: number; owner?: string | null; storage_location?: string | null };

type Order = {
  id: string;
  sumup_checkout_id: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_postcode: string | null;
  shipping_method: string | null;
  created_at: string;
};

type SaleLine = {
  orderId: string;
  date: string;
  playerName: string;
  quantity: number;
  grossPerItem: number;
  feePerItem: number;
  netPerItem: number;
  owner: string;
  tomNet: number;
  jamieNet: number;
};

function computeSales(orders: Order[]): SaleLine[] {
  const lines: SaleLine[] = [];
  for (const order of orders) {
    const orderGross = order.items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
    for (const item of order.items) {
      const gross = (item.price ?? 0) * item.quantity;
      // Proportional SumUp fee
      const fee = orderGross > 0 ? (gross / orderGross) * order.total * SUMUP_FEE_RATE : gross * SUMUP_FEE_RATE;
      const net = gross - fee;
      const owner = item.owner || "Unknown";
      const tomNet = owner === "Tom" ? net : owner === "Joint" ? net / 2 : 0;
      const jamieNet = owner === "Jamie" ? net : owner === "Joint" ? net / 2 : 0;
      lines.push({
        orderId: order.id,
        date: order.created_at,
        playerName: item.playerName,
        quantity: item.quantity,
        grossPerItem: gross,
        feePerItem: fee,
        netPerItem: net,
        owner,
        tomNet,
        jamieNet,
      });
    }
  }
  return lines;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "sales" | "pending">("orders");
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [finalizing, setFinalizing] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders((data ?? []) as Order[]);
      const { data: pending } = await supabase
        .from("pending_orders")
        .select("*")
        .order("created_at", { ascending: false });
      setPendingOrders(pending ?? []);
      setLoading(false);
    })();
  }, []);

  async function finalizePending(checkoutId: string) {
    setFinalizing(checkoutId);
    const res = await fetch("/api/sumup/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutId, shippingDetails: null }),
    });
    const data = await res.json().catch(() => ({}));
    setFinalizing(null);
    if (data.paid) {
      setPendingOrders(prev => prev.filter(p => p.sumup_checkout_id !== checkoutId));
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders((orders ?? []) as Order[]);
    } else {
      alert(data.error || "Finalize failed — payment may not be confirmed yet.");
    }
  }
  async function deleteOrder(id: string) {
    if (!confirm("Permanently delete this order? This cannot be undone.")) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setDeleting(id);
    await supabase.from("orders").delete().eq("id", id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setDeleting(null);
    if (expanded === id) setExpanded(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold text-zinc-900">Reports</h1>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setTab("orders")} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${ tab === "orders" ? "bg-amber-500 text-white" : "border border-slate-300 text-zinc-600 hover:bg-slate-50" }`}>Orders</button>
          <button onClick={() => setTab("sales")} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${ tab === "sales" ? "bg-amber-500 text-white" : "border border-slate-300 text-zinc-600 hover:bg-slate-50" }`}>Sales & Profit</button>
          <button onClick={() => setTab("pending")} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${ tab === "pending" ? "bg-amber-500 text-white" : "border border-slate-300 text-zinc-600 hover:bg-slate-50" }`}>
            Pending {pendingOrders.length > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{pendingOrders.length}</span>}
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-500">Loading...</div>
      )}

      {!loading && tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-500">No orders yet.</div>}
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-300/60 bg-white/92 shadow-sm overflow-hidden">

              {/* Order header row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpanded(expanded === order.id ? null : order.id)}
                className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition cursor-pointer"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    order.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                    order.status === "refunded" ? "bg-amber-100 text-amber-800" :
                    "bg-rose-100 text-rose-800"
                  }`}>{order.status}</span>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{order.shipping_name ?? "Unknown"}</p>
                    <p className="text-[11px] text-zinc-400">{new Date(order.created_at).toLocaleString("en-GB")}</p>
                  </div>
                  <div className="text-[12px] text-zinc-500">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {order.shipping_method ?? "Unknown shipping"}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-base font-black text-zinc-900">{formatGBP(order.total)}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void deleteOrder(order.id); }}
                    disabled={deleting === order.id}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    {deleting === order.id ? "Deleting..." : "Delete"}
                  </button>
                  <span className="text-zinc-400">{expanded === order.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="border-t border-slate-200 grid gap-6 px-6 py-5 sm:grid-cols-2">

                  {/* Items */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Items</p>
                    <ul className="space-y-2">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-800">
                            {item.playerName} <span className="text-zinc-400">×{item.quantity}</span>
                            {item.storage_location && (
                              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                📦 {item.storage_location}
                              </span>
                            )}
                          </span>
                          {item.price != null && <span className="font-semibold text-zinc-700">{formatGBP(item.price * item.quantity)}</span>}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[12px] text-zinc-500">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatGBP(order.subtotal)}</span></div>
                      <div className="flex justify-between"><span>Shipping</span><span>{formatGBP(order.shipping_cost)}</span></div>
                      <div className="flex justify-between font-bold text-zinc-800 text-sm"><span>Total</span><span>{formatGBP(order.total)}</span></div>
                    </div>
                  </div>

                  {/* Shipping address */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Ship To</p>
                    <div className="text-sm text-zinc-700 space-y-0.5">
                      {order.shipping_name && <p className="font-semibold text-zinc-900">{order.shipping_name}</p>}
                      {order.shipping_address_line1 && <p>{order.shipping_address_line1}</p>}
                      {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                      {order.shipping_city && <p>{order.shipping_city}</p>}
                      {order.shipping_postcode && <p>{order.shipping_postcode}</p>}
                      {order.shipping_email && <p className="mt-2 text-zinc-400">{order.shipping_email}</p>}
                      {order.shipping_method && <p className="mt-2 text-[12px] font-semibold text-amber-700">{order.shipping_method}</p>}
                    </div>
                    <p className="mt-4 text-[11px] text-zinc-400">SumUp ref: {order.sumup_checkout_id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "sales" && <SalesTab orders={orders} />}

      {!loading && tab === "pending" && (
        <div className="space-y-3">
          {pendingOrders.length === 0 && (
            <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 text-zinc-500">No pending orders.</div>
          )}
          {pendingOrders.map((p) => (
            <div key={p.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{p.checkout_reference}</p>
                  <p className="text-[11px] text-zinc-400">{new Date(p.created_at).toLocaleString("en-GB")}</p>
                  <p className="mt-1 text-[12px] text-zinc-500">
                    {Array.isArray(p.items) ? p.items.length : 0} item{Array.isArray(p.items) && p.items.length !== 1 ? "s" : ""}
                    {" · "}{p.shipping_rate_label ?? "Unknown shipping"}
                    {" · "}Expected: <span className="font-semibold text-zinc-800">£{Number(p.expected_amount ?? 0).toFixed(2)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void finalizePending(p.sumup_checkout_id)}
                  disabled={finalizing === p.sumup_checkout_id}
                  className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-[12px] font-bold text-amber-900 transition hover:bg-amber-200 disabled:opacity-50"
                >
                  {finalizing === p.sumup_checkout_id ? "Checking..." : "Finalize"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SalesTab({ orders }: { orders: Order[] }) {
  const sales = computeSales(orders);
  const totalTom = sales.reduce((s, l) => s + l.tomNet, 0);
  const totalJamie = sales.reduce((s, l) => s + l.jamieNet, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Tom</p>
          <p className="mt-1 text-2xl font-black text-blue-900">{formatGBP(totalTom)}</p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500">Jamie</p>
          <p className="mt-1 text-2xl font-black text-purple-900">{formatGBP(totalJamie)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Net</p>
          <p className="mt-1 text-2xl font-black text-zinc-900">{formatGBP(totalTom + totalJamie)}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 shadow-sm overflow-x-auto">
        {sales.length === 0 ? (
          <p className="text-sm text-zinc-500">No sales yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-zinc-400">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Card</th>
                <th className="pb-3 pr-4">Qty</th>
                <th className="pb-3 pr-4">Gross</th>
                <th className="pb-3 pr-4">Fee</th>
                <th className="pb-3 pr-4">Net</th>
                <th className="pb-3 pr-4">Owner</th>
                <th className="pb-3 pr-4">Tom</th>
                <th className="pb-3">Jamie</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((l, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2.5 pr-4 text-xs text-zinc-400">{new Date(l.date).toLocaleDateString("en-GB")}</td>
                  <td className="py-2.5 pr-4 font-medium text-zinc-900">{l.playerName}</td>
                  <td className="py-2.5 pr-4 text-zinc-500">{l.quantity}</td>
                  <td className="py-2.5 pr-4 text-zinc-700">{formatGBP(l.grossPerItem)}</td>
                  <td className="py-2.5 pr-4 text-red-500">-{formatGBP(l.feePerItem)}</td>
                  <td className="py-2.5 pr-4 font-semibold text-zinc-900">{formatGBP(l.netPerItem)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      l.owner === "Tom" ? "bg-blue-100 text-blue-800" :
                      l.owner === "Jamie" ? "bg-purple-100 text-purple-800" :
                      l.owner === "Joint" ? "bg-amber-100 text-amber-800" :
                      "bg-slate-100 text-slate-500"
                    }`}>{l.owner}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-blue-700 font-semibold">{l.tomNet > 0 ? formatGBP(l.tomNet) : "—"}</td>
                  <td className="py-2.5 text-purple-700 font-semibold">{l.jamieNet > 0 ? formatGBP(l.jamieNet) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
