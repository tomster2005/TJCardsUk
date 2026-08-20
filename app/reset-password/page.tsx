"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import getBrowserSupabase from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Supabase puts the session tokens in the URL hash after redirect
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    // onAuthStateChange fires with SIGNED_IN when the recovery link is clicked
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) { setLoading(false); return; }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }

    router.push("/login?reset=1");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-[#1a0e00]" style={{ background: "linear-gradient(135deg, #f5d97a, #c89b3c)", boxShadow: "0 4px 20px rgba(200,155,60,0.4)" }}>C</span>
            <span className="text-lg font-bold tracking-wide text-white">Collectra</span>
          </Link>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,155,60,0.15)", backdropFilter: "blur(20px)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
          {!ready ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Verifying reset link...</p>
              <p className="text-xs text-[rgba(255,255,255,0.3)]">If nothing happens, your link may have expired. <Link href="/forgot-password" className="text-[#c89b3c] hover:underline">Request a new one</Link>.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-white">Set new password</h1>
              <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.5)]">Choose a strong password for your account.</p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">New password</span>
                  <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    required
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </label>

                <label className="block">
                  <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Confirm password</span>
                  <input
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    type="password"
                    required
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                  {confirm && password !== confirm && (
                    <p className="mt-1 text-[11px] text-rose-400">Passwords do not match</p>
                  )}
                </label>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-[13px] text-rose-300" style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.2)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-gold mt-2 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50">
                  {loading ? "Saving..." : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
