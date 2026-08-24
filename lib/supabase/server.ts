import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

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

/**
 * Resolve the authenticated user from the request's Authorization header.
 * Returns the validated user ID, or null for unauthenticated / guest requests.
 * Never trusts any value supplied in the request body or query string.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  // Use the anon key client to validate the JWT — getUser() verifies the
  // token signature server-side; it does not trust the payload alone.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default createServerSupabase;
