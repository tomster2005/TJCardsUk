import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:discount",
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

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
