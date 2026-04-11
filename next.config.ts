import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Content Security Policy (non-studio routes).
// NOTE: 'unsafe-inline' in script-src/style-src is a known trade-off documented
// in security audit F-23 / F-20 — three Next.js layout inline scripts currently
// require it. Migration to a nonce-based CSP is tracked separately and would
// allow removal of both 'unsafe-inline' entries.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' https://cdn.sanity.io",
  "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Minimal CSP for /studio/* — security audit F-13. Sanity Studio has its own
// permissive runtime (many sanity.io origins, eval, inline styles), so this
// CSP stays very loose on script/style/connect but enforces one critical
// directive: frame-ancestors 'self' blocks clickjacking attempts that would
// embed the logged-in studio in a malicious iframe. X-Frame-Options: SAMEORIGIN
// below is the legacy-browser fallback for the same protection.
const studioCsp = [
  "default-src 'self' https://*.sanity.io https://cdn.sanity.io",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sanity.io",
  "style-src 'self' 'unsafe-inline' https://*.sanity.io https://fonts.googleapis.com",
  "font-src 'self' data: https://*.sanity.io https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.sanity.io https://cdn.sanity.io",
  "connect-src 'self' https://*.sanity.io https://*.api.sanity.io wss://*.api.sanity.io",
  "frame-src 'self' https://*.sanity.io",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

// Permissions-Policy: explicit deny-list covering all features the site does
// not use (security audit F-26). Default is allowlist, so anything omitted
// here is still available to scripts.
const permissionsPolicy = [
  "accelerometer=()",
  "ambient-light-sensor=()",
  "autoplay=()",
  "battery=()",
  "bluetooth=()",
  "camera=()",
  "clipboard-read=()",
  "clipboard-write=()",
  "display-capture=()",
  "document-domain=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "hid=()",
  "idle-detection=()",
  "interest-cohort=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "serial=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
  async headers() {
    return [
      // Sanity Studio — clickjacking protection (security audit F-13).
      // The studio is embedded as a Next.js route at /studio and we cannot
      // inherit the site-wide CSP (it would break the studio SPA). Instead
      // we serve a minimal studio-specific CSP with frame-ancestors 'self'
      // plus X-Frame-Options: SAMEORIGIN as a legacy fallback, so a
      // malicious third-party page cannot iframe /studio and hijack an
      // authenticated admin via clickjacking.
      {
        source: "/studio/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: studioCsp },
        ],
      },
      // Restrictive headers for all other routes
      {
        source: "/((?!studio).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: permissionsPolicy },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
