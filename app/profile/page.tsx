import { Layout } from "@/components/Layout";

export default function ProfilePage() {
  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[2rem] p-10 shadow-[0_20px_48px_rgba(15,23,42,0.09)]">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-slate-300/55 bg-gradient-to-r from-white/86 via-[#fcfaf3]/92 to-white/86" />
        <div className="space-y-4">
          <p className="relative text-xs uppercase tracking-[0.34em] text-amber-700">Profile</p>
          <h1 className="relative text-4xl font-semibold text-zinc-900 sm:text-5xl">Manage your collector profile</h1>
          <p className="relative max-w-2xl text-zinc-600">
            A placeholder for account details, settings, and preferences in the Collectra experience.
          </p>
        </div>

        <div className="relative mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 stagger-grid">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-3xl border border-slate-300/60 bg-white/92 p-6 card-lift">
              <p className="text-sm text-zinc-500">Placeholder content</p>
              <div className="mt-4 h-80 rounded-3xl bg-slate-100/90 skeleton-shimmer" />
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
