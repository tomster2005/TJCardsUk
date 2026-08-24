"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const wasReset = searchParams.get("reset") === "1";
  const { signIn, fetchRole } = useAuth();
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { getBrowserSupabase } = await import("@/lib/supabase/client");
    const supabase = getBrowserSupabase();
    if (!supabase) { setLoading(false); return; }

    const input = emailOrUsername.trim();

    if (!input.includes("@")) {
      // ── Username path: resolved server-side, email never exposed ────────
      // The API route handles lookup + sign-in atomically with rate limiting.
      const res = await fetch("/api/auth/username-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: input, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Invalid credentials.");
        setLoading(false);
        return;
      }
      // Restore the session into the browser Supabase client
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (sessionErr) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }
    } else {
      // ── Email path: standard Supabase signIn ─────────────────────────────
      const { error } = await signIn(input, password);
      if (error) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const userRole = await fetchRole(user.id);
      setLoading(false);
      router.refresh();
      router.push(userRole === "admin" ? "/admin" : "/dashboard");
      return;
    }

    setLoading(false);
    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden" style={{ background: "#0a0a0c" }}>

      {/* ── Animated background ── */}
      <div className="pointer-events-none fixed inset-0">
        {/* Deep gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0800 0%, #0a0a0c 40%, #0d0500 100%)" }} />
        {/* Gold orbs */}
        <div className="absolute -left-40 top-1/4 h-[600px] w-[600px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #f5d97a, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute -right-40 bottom-1/4 h-[500px] w-[500px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #c89b3c, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute left-1/2 top-0 h-[300px] w-[800px] -translate-x-1/2 opacity-[0.04]" style={{ background: "radial-gradient(ellipse, #f5d97a, transparent 70%)", filter: "blur(20px)" }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.5) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        {/* Floating cards decoration */}
        <div className="absolute left-[8%] top-[15%] h-32 w-24 rotate-[-15deg] rounded-xl opacity-[0.06]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 8px 32px rgba(200,155,60,0.3)" }} />
        <div className="absolute left-[12%] top-[20%] h-32 w-24 rotate-[-8deg] rounded-xl opacity-[0.04]" style={{ background: "linear-gradient(135deg, #c89b3c, #8b6914)", boxShadow: "0 8px 32px rgba(200,155,60,0.2)" }} />
        <div className="absolute right-[8%] top-[20%] h-36 w-24 rotate-[12deg] rounded-xl opacity-[0.06]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 8px 32px rgba(200,155,60,0.3)" }} />
        <div className="absolute right-[13%] top-[28%] h-32 w-24 rotate-[6deg] rounded-xl opacity-[0.04]" style={{ background: "linear-gradient(135deg, #c89b3c, #8b6914)" }} />
        <div className="absolute bottom-[15%] left-[6%] h-28 w-20 rotate-[10deg] rounded-xl opacity-[0.05]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)" }} />
        <div className="absolute bottom-[20%] right-[7%] h-28 w-20 rotate-[-12deg] rounded-xl opacity-[0.05]" style={{ background: "linear-gradient(135deg, #c89b3c, #8b6914)" }} />
      </div>

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16">
        <div className="max-w-md space-y-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[rgba(200,155,60,0.7)]">Welcome to</span>
            <h1 className="mt-3 text-6xl font-black tracking-tight text-white" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
              Collectra
            </h1>
            <p className="mt-1 text-[13px] uppercase tracking-[0.4em] text-[rgba(200,155,60,0.6)]">The Vault</p>
          </div>
          <p className="text-[15px] leading-relaxed text-[rgba(255,255,255,0.4)]">
            Your home for trading cards. Browse the vault, track your collection, and find your next chase card.
          </p>
          <div className="flex flex-col gap-3">
            {["⚽ Football cards", "✨ Disney & more", "📦 Boxes & sealed", "🏆 Graded slabs coming soon"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(200,155,60,0.3), transparent)" }} />
                <span className="text-[13px] text-[rgba(255,255,255,0.5)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="mb-10 text-center lg:hidden">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 24px rgba(200,155,60,0.5)" }}>C</span>
              <span className="text-xl font-black text-white">Collectra</span>
              <span className="text-[9px] uppercase tracking-[0.35em] text-[rgba(200,155,60,0.6)]">The Vault</span>
            </Link>
          </div>

          {/* Form card */}
          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,155,60,0.12)", backdropFilter: "blur(24px)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}>

            <div className="mb-7">
              <h2 className="text-2xl font-black text-white">Sign in</h2>
              <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.4)]">Access your vault</p>
            </div>

              {wasReset && (
                <div className="rounded-xl px-4 py-3 text-[13px] text-emerald-300 mb-4" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  Password updated successfully. Sign in with your new password.
                </div>
              )}
              <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.4)]">Email or Username</span>
                <input
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  type="text"
                  required
                  autoComplete="username"
                  className="mt-2 w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.4)]">Password</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="mt-2 w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  placeholder="••••••••"
                />
                <div className="mt-1.5 text-right">
                  <Link href="/forgot-password" className="text-[11px] text-[rgba(255,255,255,0.3)] hover:text-[#c89b3c] transition">Forgot password?</Link>
                </div>
              </label>

              {error && (
                <div className="rounded-xl px-4 py-3 text-[13px] text-rose-300" style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.2)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl py-3.5 text-sm font-black tracking-wide disabled:opacity-50 transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", color: "#1a0e00", boxShadow: "0 4px 20px rgba(200,155,60,0.4)" }}
              >
                {loading ? "Signing in..." : "Enter the Vault →"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-[11px] text-[rgba(255,255,255,0.2)]">NEW HERE?</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            <Link
              href="/register"
              className="mt-4 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition hover:bg-[rgba(255,255,255,0.05)]"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
