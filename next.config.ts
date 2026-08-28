import type { NextConfig } from "next";

// ── Production origins ────────────────────────────────────────────────────
const PROD_ORIGIN = "https://collectrauk.co.uk";
const isDev = process.env.NODE_ENV !== "production";

// ── Content Security Policy ───────────────────────────────────────────────
// Each directive is commented with the reason every host is permitted.
const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],

  "script-src": [
    "'self'",
    // Next.js inline bootstrap scripts use nonces in prod; in dev they need
    // unsafe-eval for hot-reload. We allow unsafe-inline only in dev.
    ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : ["'unsafe-inline'"]),
    // Vercel Analytics — injects a small tracking script from this origin.
    "https://va.vercel-scripts.com",
  ],

  "style-src": [
    "'self'",
    // Tailwind CSS-in-JS and Next.js inject inline <style> tags at runtime.
    "'unsafe-inline'",
    // Google Fonts stylesheet (Geist, Playfair Display).
    "https://fonts.googleapis.com",
  ],

  "font-src": [
    "'self'",
    // Google Fonts binary font files (woff2).
    "https://fonts.gstatic.com",
  ],

  "img-src": [
    "'self'",
    "data:",
    "blob:",
    // Supabase Storage — card images, avatars, personal card photos.
    "https://pnouhcbgsyucsofunjor.supabase.co",
    // Cloudflare R2 — card images (replacing Supabase Storage).
    "https://pub-938bfbdd04af44fab33822083b71fb2a.r2.dev",
    // Open Graph / social preview images may be fetched by crawlers via
    // the metadataBase URL; allow the production origin explicitly.
    PROD_ORIGIN,
  ],

  "connect-src": [
    "'self'",
    // Supabase REST API, Auth, Realtime and Storage endpoints.
    "https://pnouhcbgsyucsofunjor.supabase.co",
    "wss://pnouhcbgsyucsofunjor.supabase.co",
    // SumUp REST API — called server-side only, but the hosted checkout
    // page may make client-side status polling calls.
    "https://api.sumup.com",
    // Vercel Analytics beacon.
    "https://vitals.vercel-insights.com",
    ...(isDev ? ["http://localhost:3000", "ws://localhost:3000"] : []),
  ],

  "frame-src": [
    // SumUp hosted checkout is loaded in a redirect (not an iframe), but
    // SumUp's payment widget may open in a frame on some flows.
    "https://pay.sumup.com",
  ],

  // Disallow all plugins (Flash, etc.).
  "object-src": ["'none'"],

  // Only allow workers from the same origin (Next.js service worker).
  "worker-src": ["'self'"],

  // frame-ancestors replaces the X-Frame-Options header.
  // Prevents Collectra pages from being embedded in any external frame.
  "frame-ancestors": ["'none'"],

  // Restrict form submissions to same origin only.
  "form-action": ["'self'"],

  // Upgrade any accidental http:// sub-resource requests to https://.
  "upgrade-insecure-requests": [],
};

function buildCsp(): string {
  return Object.entries(cspDirectives)
    .map(([directive, values]) =>
      values.length > 0 ? `${directive} ${values.join(" ")}` : directive,
    )
    .join("; ");
}

const nextConfig: NextConfig = {
  onDemandEntries: {
    maxInactiveAge: 10 * 1000,
    pagesBufferLength: 2,
  },
  async headers() {
    const csp = buildCsp();
    const securityHeaders = [
      {
        // Prevent MIME-type sniffing — browsers must honour the declared
        // Content-Type and not guess based on content.
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        // Only send the origin (no path/query) as the Referer when navigating
        // to a different site. Full URL is sent for same-origin navigations.
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        // Disable browser features Collectra does not use.
        // camera/microphone/geolocation/payment are not used by the app;
        // disabling them reduces the attack surface if a XSS occurs.
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
      },
      {
        // HSTS — tell browsers to always use HTTPS for this origin.
        // max-age=63072000 = 2 years (recommended minimum for preload).
        // includeSubDomains covers any subdomains on collectrauk.co.uk.
        // Only set in production; dev runs on http://localhost.
        ...(isDev
          ? { key: "X-HSTS-Skipped-In-Dev", value: "1" }
          : {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            }),
      },
      {
        key: "Content-Security-Policy",
        value: csp,
      },
    ];

    return [
      {
        // Apply security headers to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Apple Pay domain association file — must be served as JSON.
        source: "/.well-known/apple-developer-merchantid-domain-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
