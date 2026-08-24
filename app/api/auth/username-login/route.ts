import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceSupabase, getUserIdFromRequest } from "@/lib/supabase/server";
import { rejectForbiddenOrigin } from "@/lib/api/origin";
import { limiters, getIp, checkLimit } from "@/lib/api/ratelimit";;

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const limited = await checkLimit(limiters.auth, ip);
  if (limited) return limited;

  const forbidden = rejectForbiddenOrigin(request);
  if (forbidden) return forbidden;

  let username: string;
  let password: string;

  try {
    const body = await request.json();
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  // ── Resolve email server-side — never returned to the client ──────────
  // Uses the service role so get_email_by_username is never a publicly
  // callable RPC from the browser.
  const serviceSupabase = createServiceSupabase();
  const { data: email, error: lookupError } = await serviceSupabase
    .rpc("get_email_by_username", { p_username: username });

  if (lookupError || !email) {
    // Username not found — identical response to wrong password.
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // ── Sign in with the resolved email ───────────────────────────────────
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { auth: { persistSession: false } },
  );

  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    // Wrong password — same generic error, same status.
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // ── Return session — email intentionally omitted from response ─────────
  return NextResponse.json({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    expires_at: authData.session.expires_at,
    user: { id: authData.session.user.id },
  });
}
