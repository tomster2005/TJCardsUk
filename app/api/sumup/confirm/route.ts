import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:confirm",
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  // Only allow requests from the same origin
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const token = process.env.SUMUP_API_KEY?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing SUMUP_API_KEY." }, { status: 500 });
  }

  const checkoutId = request.nextUrl.searchParams.get("checkoutId")?.trim();
  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId is required." }, { status: 400 });
  }

  const sumupBase = (process.env.SUMUP_API_BASE?.trim() || "https://api.sumup.com").replace(/\/$/, "");
  const response = await fetch(`${sumupBase}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      {
        error: data?.message || "Unable to confirm SumUp checkout.",
        details: data,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    checkoutId,
    status: data?.status || "UNKNOWN",
    amount: data?.amount,
    currency: data?.currency,
    raw: data,
  });
}
