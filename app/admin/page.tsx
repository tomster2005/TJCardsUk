"use client";

import Link from "next/link";

export default function AdminPage() {

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-9 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold text-zinc-900">Admin Dashboard</h1>
        <p className="mt-3 text-sm text-zinc-600">Manage the Collectra catalogue, cards, and publishing workflow from one premium workspace.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-7 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Cards</h2>
              <p className="mt-1 text-sm text-zinc-600">Review cards, update status, and manage stock.</p>
            </div>
            <Link href="/admin/cards" className="rounded-full border border-amber-400/40 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900">
              Open cards
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-7 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Add Card</h2>
              <p className="mt-1 text-sm text-zinc-600">Create a draft or published entry for the catalogue.</p>
            </div>
            <Link href="/admin/cards/new" className="rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
              New card
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-300/60 bg-white/90 p-7 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Bulk Image Upload</h2>
              <p className="mt-1 text-sm text-zinc-600">Upload scanned card images in bulk (front/back pairs).</p>
            </div>
            <Link href="/admin/bulk-upload" className="rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
              Upload
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
