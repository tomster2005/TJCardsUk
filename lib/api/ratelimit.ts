import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Single shared Redis connection for all rate limiters.
const redis = Redis.fromEnv();

// ── Pre-configured limiters ───────────────────────────────────────────────
//
// Tuning rationale:
//
//  auth          5 / 15 min  — brute-force protection; a real user needs 1
//  checkout      5 / 1 min   — creating a SumUp checkout is expensive; a
//                              legitimate user clicks "Pay" once per session
//  finalize      5 / 1 min   — payment fulfilment; same reasoning as checkout
//  confirm      20 / 1 min   — status polling; success page may retry a few
//                              times while waiting for SumUp to confirm
//  discount     10 / 5 min   — code validation; tighter window prevents
//                              automated code enumeration
//
// All use sliding window so bursts are smoothed rather than hard-reset.

export const limiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "rl:auth",
  }),

  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:checkout",
  }),

  finalize: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:finalize",
  }),

  confirm: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "rl:confirm",
  }),

  discount: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "5 m"),
    prefix: "rl:discount",
  }),
} as const;

// ── IP extraction ─────────────────────────────────────────────────────────

export function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

// ── Single-key limit check ────────────────────────────────────────────────
// Returns a 429 NextResponse if the limit is exceeded, otherwise null.

export async function checkLimit(
  limiter: Ratelimit,
  key: string,
): Promise<NextResponse | null> {
  const { success, reset } = await limiter.limit(key);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  return null;
}

// ── Dual-key limit check ──────────────────────────────────────────────────
// Checks both an IP-keyed bucket and a user-keyed bucket (when userId is
// available). Both must pass. This prevents:
//   - A single IP hammering multiple users' checkouts
//   - A single authenticated user rotating IPs to bypass the IP limit
//
// userId is optional — unauthenticated requests fall back to IP-only.

export async function checkDualLimit(
  limiter: Ratelimit,
  ip: string,
  userId: string | null,
): Promise<NextResponse | null> {
  const ipResult = await limiter.limit(`ip:${ip}`);
  if (!ipResult.success) {
    const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (userId) {
    const userResult = await limiter.limit(`user:${userId}`);
    if (!userResult.success) {
      const retryAfter = Math.ceil((userResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  }

  return null;
}
