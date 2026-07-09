import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client factory. Uses the same public keys for now.
// In production you may want to use a service_role key for privileged actions.
export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(supabaseUrl, supabaseKey);
}

export default createServerSupabase;
