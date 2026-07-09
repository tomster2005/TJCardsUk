"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error.message ?? String(error));
      return;
    }
    setMessage("Check your email for a confirmation link. Proceed to login once confirmed.");
    // Optionally redirect to login
    setTimeout(() => router.push("/login"), 1600);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8">
        <h1 className="text-2xl font-semibold text-white">Create an account</h1>
        <p className="mt-2 text-sm text-zinc-400">Register with email and password (demo only).</p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm text-zinc-300">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none" />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-300">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none" />
          </label>

          {error ? <div className="text-rose-400">{error}</div> : null}
          {message ? <div className="text-emerald-300">{message}</div> : null}

          <div className="mt-4 flex items-center gap-2">
            <button type="submit" disabled={loading} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100">
              {loading ? "Creating…" : "Create account"}
            </button>
            <button type="button" onClick={() => router.push("/login")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
              Have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
