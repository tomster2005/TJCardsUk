"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn, fetchRole } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message ?? String(error));
      setLoading(false);
      return;
    }

    // Fetch role to determine redirect destination
    const { getBrowserSupabase } = await import("@/lib/supabase/client");
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const userRole = await fetchRole(user.id);
        setLoading(false);
        if (userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    }

    // Fallback if we can't determine role
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-[rgba(200,155,60,0.2)] bg-white p-8 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-500">Sign in with email and password.</p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[rgba(200,155,60,0.4)] focus:bg-white" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#fafaf9] px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[rgba(200,155,60,0.4)] focus:bg-white" />
          </label>

          {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 border border-rose-200">{error}</div> : null}

          <div className="mt-4 flex items-center gap-2">
            <button type="submit" disabled={loading} className="btn-gold rounded-full px-6 py-2.5 text-sm">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" onClick={() => router.push("/register")} className="rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-[rgba(0,0,0,0.03)] hover:text-zinc-900">
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
