import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

// Matcher scope — security audit F-40.
//
// The middleware runs ONLY on:
//   - "/"                    → the root, so requests without a locale prefix
//                              are redirected to the default locale ("/it")
//   - "/(it|en)/:path*"      → every localized page under one of the
//                              supported locale prefixes
//
// It intentionally does NOT match:
//   - /api/*         → API routes handle auth / rate-limiting themselves
//                      and must not be rewritten by next-intl
//   - /studio/*      → Sanity Studio is a self-contained SPA
//   - /_next/*       → Next.js build assets (chunks, images, etc.)
//   - /sitemap.xml,
//     /robots.txt,
//     /favicon.ico   → static metadata files
//   - /icons, /images etc. → anything in /public is served as-is
//
// If you add a new top-level public route that needs locale handling,
// remember to either place it under /(it|en)/... or to extend the matcher
// above. Adding /api or /studio here would break those routes.
export const config = {
  matcher: ["/", "/(it|en)/:path*"],
};
