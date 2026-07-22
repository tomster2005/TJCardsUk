import { createClient } from "@supabase/supabase-js";

// Public read-only server client — safe for fetching published data.
export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(supabaseUrl, supabaseKey);
}

// Privileged server client — bypasses RLS. Only use in trusted server-side code.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export default createServerSupabase;
