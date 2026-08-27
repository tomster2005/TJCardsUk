import { NextRequest, NextResponse } from "next/server";

// Production origin derived from NEXT_PUBLIC_APP_URL.
// Falls back to the hardcoded production domain if the env var is absent.
const PROD_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? "https://collectrauk.co.uk")
  .replace(/\/$/, "");

function allowedOrigins(): string[] {
  return [
    "https://collectrauk.co.uk",
    "https://www.collectrauk.co.uk",
    "https://collectrauk.com",
    "https://www.collectrauk.com",
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
  ];
}

/**
 * Returns a 403 NextResponse if the request Origin header is present and not
 * in the allowlist. Returns null if the origin is acceptable.
 *
 * Requests with no Origin header (server-to-server, curl) are passed through —
 * origin checking is a browser CORS defence, not a substitute for auth.
 * All routes have independent auth (rate limiting, JWT, RLS).
 */
export function rejectForbiddenOrigin(request: NextRequest): NextResponse | null {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return null;

  let parsed: URL;
  try {
    parsed = new URL(originHeader);
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Normalise to scheme://host — strips any path/query the header should never have
  const normalised = `${parsed.protocol}//${parsed.host}`;

  if (!allowedOrigins().includes(normalised)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

/**
 * Returns the canonical app base URL for building redirect URLs.
 * Never reflects the request Origin — always uses the configured URL.
 */
export function getCanonicalBaseUrl(): string {
  return PROD_ORIGIN;
}
