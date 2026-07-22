"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getBrowserSupabase() {
  if (typeof window === "undefined") return null;
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  if (!supabaseUrl || !supabaseKey) return null;

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          if (typeof document === "undefined") return null;
          const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
          return match ? decodeURIComponent(match[2]) : null;
        },
        setItem: (key, value) => {
          if (typeof document === "undefined") return;
          document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`;
        },
        removeItem: (key) => {
          if (typeof document === "undefined") return;
          document.cookie = `${key}=;path=/;max-age=0`;
        },
      },
    },
  });

  return supabase;
}

export default getBrowserSupabase;
