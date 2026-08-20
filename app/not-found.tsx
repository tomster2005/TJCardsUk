import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.5) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      <div className="pointer-events-none fixed left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.4), transparent 70%)" }} />

      <div className="relative animate-fade-up space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-3xl" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 8px 32px rgba(200,155,60,0.4)" }}>
          🃏
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[rgba(200,155,60,0.6)]">404 — Not Found</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Card not in the vault.</h1>
          <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-[rgba(255,255,255,0.4)]">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full px-6 py-3 text-[13px] font-black text-[#1a0e00] transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 20px rgba(200,155,60,0.4)" }}
          >
            Go home
          </Link>
          <Link
            href="/catalogue"
            className="rounded-full border border-[rgba(255,255,255,0.1)] px-6 py-3 text-[13px] font-semibold text-[rgba(255,255,255,0.6)] transition hover:border-[rgba(255,255,255,0.2)] hover:text-white"
          >
            Browse cards
          </Link>
        </div>
      </div>
    </div>
  );
}
