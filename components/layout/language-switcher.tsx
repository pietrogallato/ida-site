"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return;

    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as "it" | "en")) {
      segments[1] = nextLocale;
    }
    const newPath = segments.join("/") || "/";

    router.push(newPath);
  }

  return (
    <nav aria-label={t("switchLanguage")} className="flex rounded-full border border-border bg-surface-alt p-0.5">
      <button
        onClick={() => switchLocale("it")}
        aria-current={locale === "it" ? "true" : undefined}
        aria-label="Italiano"
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          locale === "it"
            ? "bg-primary-dark text-white shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        IT
      </button>
      <button
        onClick={() => switchLocale("en")}
        aria-current={locale === "en" ? "true" : undefined}
        aria-label="English"
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          locale === "en"
            ? "bg-primary-dark text-white shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
    </nav>
  );
}
