"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { useAnalyticsOptOut } from "@/lib/analytics-consent";

/**
 * Conditional mount for Vercel telemetry — security audit F-17 / F-48.
 *
 * When the visitor has set the opt-out flag (via the tracking
 * preferences dialog), neither Analytics nor Speed Insights are
 * rendered, so no beacon is sent on this page or on any subsequent
 * navigation within the same session. Toggling the flag back to
 * "allow" re-mounts the components immediately without requiring a
 * page reload.
 */
export function AnalyticsGate() {
  const { optedOut } = useAnalyticsOptOut();
  if (optedOut) return null;
  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
