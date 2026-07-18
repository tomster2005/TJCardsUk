"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function LoginPage() {
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

    // If input looks like an email use it directly, otherwise look up by username
    let email = emailOrUsername.trim();
    if (!email.includes("@")) {
      const { data } = await supabase.rpc("get_email_by_username", { p_username: email });
      if (!data) {
        setError("No account found with that username.");
        setLoading(false);
        return;
      }
      email = data;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message ?? String(error));
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const userRole = await fetchRole(user.id);
      setLoading(false);
      router.push(userRole === "admin" ? "/admin" : "/dashboard");
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.3), transparent 70%)" }} />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 20px rgba(200,155,60,0.4)" }}>
              C
            </span>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold tracking-wide text-white">Collectra</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[rgba(200,155,60,0.7)]">The Vault</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,155,60,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.5)]">Sign in to access your vault</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Email or Username</span>
              <input
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                type="text"
                required
                autoComplete="username"
                className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[rgba(255,255,255,0.25)] focus:border-[rgba(200,155,60,0.5)]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="you@example.com or username"
              />
            </label>

            <label className="block">
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[rgba(255,255,255,0.25)] focus:border-[rgba(200,155,60,0.5)]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div className="rounded-xl px-4 py-3 text-[13px] text-rose-300" style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold mt-2 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[rgba(255,255,255,0.4)]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[var(--gold-400)] hover:text-[var(--gold-300)]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
