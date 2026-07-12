"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, username.trim());
    setLoading(false);
    if (error) {
      setError(error.message ?? String(error));
      return;
    }
    setMessage("Check your email for a confirmation link. Proceed to login once confirmed.");
    setTimeout(() => router.push("/login"), 1600);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-[rgba(200,155,60,0.2)] bg-white p-8 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
        <h1 className="text-2xl font-semibold text-zinc-900">Create an account</h1>
        <p className="mt-2 text-sm text-zinc-500">Join the Collectra community.</p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" required className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[rgba(200,155,60,0.4)] focus:bg-white" placeholder="e.g. CardCollector99" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[rgba(200,155,60,0.4)] focus:bg-white" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[rgba(200,155,60,0.4)] focus:bg-white" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Confirm Password</span>
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[rgba(200,155,60,0.4)] focus:bg-white" />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">Passwords do not match</p>
            )}
          </label>

          {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 border border-rose-200">{error}</div> : null}
          {message ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">{message}</div> : null}

          <div className="mt-4 flex items-center gap-2">
            <button type="submit" disabled={loading} className="btn-gold rounded-full px-6 py-2.5 text-sm">
              {loading ? "Creating..." : "Create account"}
            </button>
            <button type="button" onClick={() => router.push("/login")} className="rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-[rgba(0,0,0,0.03)] hover:text-zinc-900">
              Have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
