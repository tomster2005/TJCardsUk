"use client";

import { useState } from "react";
import Link from "next/link";
import getBrowserSupabase from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) { setLoading(false); return; }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <h1 className="text-xl font-black text-white">Check your email</h1>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">We sent a password reset link to <span className="text-[#c89b3c]">{email}</span>. Click the link in the email to set a new password.</p>
              <Link href="/login" className="block mt-4 text-sm text-[rgba(255,255,255,0.4)] hover:text-white transition">← Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-white">Reset password</h1>
              <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.5)]">Enter your email and we&apos;ll send you a reset link.</p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Email</span>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </label>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-[13px] text-rose-300" style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.2)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-gold mt-2 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50">
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-[13px] text-[rgba(255,255,255,0.4)]">
                <Link href="/login" className="hover:text-white transition">← Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
