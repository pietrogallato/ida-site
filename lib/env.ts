/**
 * Environment variable schema.
 *
 * Security audit F-30. Previously, code paths that needed an env var used
 * the non-null assertion operator (`process.env.X!`), which silently let
 * `undefined` flow through at runtime when the var was missing. This module
 * centralises the schema so that:
 *
 *   1. Required public vars (needed by every build) fail fast at module
 *      load time with a clear error message.
 *   2. Optional runtime-only secrets are typed as `string | undefined` so
 *      the TypeScript checker forces callers to handle the missing case
 *      explicitly (no more `!`).
 *
 * Keep this file free of `@/*` path aliases so it can be imported from
 * Sanity Studio config files (which are built by Sanity's own bundler,
 * not Next.js) using a relative path.
 */

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example for the full list of variables this app expects.`,
    );
  }
  return value;
}

export const env = {
  // ---- Required at build time (sitemap, static params, studio) ----
  NEXT_PUBLIC_SANITY_PROJECT_ID: required(
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  ),
  NEXT_PUBLIC_SANITY_DATASET: required(
    "NEXT_PUBLIC_SANITY_DATASET",
    process.env.NEXT_PUBLIC_SANITY_DATASET,
  ),

  // ---- Optional runtime-only secrets ----
  // These are only needed on specific API routes. Callers MUST check for
  // undefined and respond with a 500 when absent — never use `!`.
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  SANITY_REVALIDATION_SECRET: process.env.SANITY_REVALIDATION_SECRET,
} as const;
