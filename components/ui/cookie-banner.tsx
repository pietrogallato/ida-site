"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const STORAGE_KEY = "cookie-banner-dismissed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return true; // assume dismissed on server to avoid flash
}

export function CookieBanner() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const locale = useLocale();
  const t = useTranslations("cookieBanner");

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label={t("ariaLabel")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4"
    >
      <p className="text-sm text-foreground-muted">
        {t("text")}{" "}
        <Link
          href={`/${locale}/privacy`}
          className="underline transition-colors hover:text-primary-text"
        >
          {t("privacyLink")}
        </Link>
      </p>
      <button
        onClick={dismiss}
        className="mt-3 shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:mt-0"
      >
        {t("dismiss")}
      </button>
    </div>
  );
}
