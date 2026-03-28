"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";
import { services } from "@/content/services";
import type { Locale } from "@/types";

// Static segment translations derived from routing.pathnames
const segmentTranslations: Record<string, Record<string, string>> = {
  "chi-sono": { en: "about" },
  about: { it: "chi-sono" },
  servizi: { en: "services" },
  services: { it: "servizi" },
  contatti: { en: "contact" },
  contact: { it: "contatti" },
  "come-funziona": { en: "how-it-works" },
  "how-it-works": { it: "come-funziona" },
};

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

    // Translate all localized path segments
    for (let i = 2; i < segments.length; i++) {
      const segment = segments[i];

      // Check static segment translations
      const translation = segmentTranslations[segment]?.[nextLocale];
      if (translation) {
        segments[i] = translation;
        continue;
      }

      // Check service slug translations
      const service = services.find(
        (s) => s.slugs[locale as Locale] === segment
      );
      if (service) {
        segments[i] = service.slugs[nextLocale as Locale];
      }
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
