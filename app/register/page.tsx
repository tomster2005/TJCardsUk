"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) { setError("Username is required."); return; }
    if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const { error } = await signUp(email, password, username.trim());
    setLoading(false);
    if (error) { setError(error.message ?? String(error)); return; }
    setMessage("Check your email for a confirmation link, then sign in.");
    setTimeout(() => router.push("/login"), 1600);
  };

  const inputClass = "mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[rgba(255,255,255,0.25)] focus:border-[rgba(200,155,60,0.5)]";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #0d0d0f 0%, #1a0e06 40%, #0d0d0f 100%)" }}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(200,155,60,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,155,60,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
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
          <h1 className="text-2xl font-black text-white">Create your vault</h1>
          <p className="mt-1 text-[13px] text-[rgba(255,255,255,0.5)]">Join the Collectra community</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Username</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" required className={inputClass} style={inputStyle} placeholder="e.g. CardCollector99" />
            </label>

            <label className="block">
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={inputClass} style={inputStyle} placeholder="you@example.com" />
            </label>

            <label className="block">
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Password</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className={inputClass} style={inputStyle} placeholder="••••••••" />
            </label>

            <label className="block">
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Confirm Password</span>
              <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required className={inputClass} style={inputStyle} placeholder="••••••••" />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-400">Passwords do not match</p>
              )}
            </label>

            {error && (
              <div className="rounded-xl px-4 py-3 text-[13px] text-rose-300" style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.2)" }}>
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl px-4 py-3 text-[13px] text-emerald-300" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold mt-2 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50">
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[rgba(255,255,255,0.4)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--gold-400)] hover:text-[var(--gold-300)]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
