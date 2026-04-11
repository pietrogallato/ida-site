"use client";

/**
 * Analytics opt-out — security audit F-17 / F-48.
 *
 * Legal basis chosen for Vercel Analytics + Speed Insights is
 * legitimate interest (GDPR art. 6(1)(f)): the telemetry is aggregated,
 * cookieless, does not profile users, and is used solely to improve the
 * quality of the site. A visible opt-out is still required so the user
 * can exercise the right to object (art. 21 GDPR).
 *
 * The opt-out state is persisted in localStorage under a stable key.
 * Default is "opt-in" (analytics active); only an explicit "true" value
 * switches off the telemetry. The hook uses useSyncExternalStore so
 * every component in the tree reacts to the change instantly when the
 * user flips the toggle, without a page reload.
 */

import { useCallback, useSyncExternalStore } from "react";

export const ANALYTICS_OPT_OUT_KEY = "analytics-opt-out";

function subscribe(callback: () => void): () => void {
  // StorageEvent only fires on other tabs, so we also listen to a
  // custom event dispatched by setOptedOut below. This keeps the
  // current tab in sync without polling.
  window.addEventListener("storage", callback);
  window.addEventListener("analytics-consent-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("analytics-consent-change", callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  // On the server assume opt-in (analytics enabled). The gate renders
  // the Analytics scripts on both server and client so there is no
  // hydration mismatch when the user has not opted out. If the user
  // has opted out, the client re-renders and unmounts them on first
  // paint — analytics have not had time to send a beacon yet.
  return false;
}

export function useAnalyticsOptOut(): {
  optedOut: boolean;
  setOptedOut: (value: boolean) => void;
} {
  const optedOut = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setOptedOut = useCallback((value: boolean) => {
    try {
      if (value) {
        localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
      } else {
        localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
      }
      window.dispatchEvent(new Event("analytics-consent-change"));
    } catch {
      // localStorage unavailable (private mode, quota): we silently
      // fall back to a no-op. The user can still browse; the opt-out
      // just does not persist across reloads.
    }
  }, []);

  return { optedOut, setOptedOut };
}
