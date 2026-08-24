import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rejectForbiddenOrigin } from "@/lib/api/origin";
import { limiters, getIp, checkLimit } from "@/lib/api/ratelimit";

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const limited = await checkLimit(limiters.discount, ip);
  if (limited) return limited;

  const forbidden = rejectForbiddenOrigin(request);
  if (forbidden) return forbidden;

  let code: string;
  try {
    const body = await request.json();
    code = String(body.code ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided." }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("discount_codes")
    .select("code, type")
    .eq("code", code)
    .eq("active", true)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 404 });
  }

  return NextResponse.json({ valid: true, type: data.type, code: data.code });
}
