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
    <div
      className="flex rounded-full border border-border bg-surface-alt p-0.5"
      role="radiogroup"
      aria-label={t("switchLanguage")}
    >
      <button
        onClick={() => switchLocale("it")}
        role="radio"
        aria-checked={locale === "it"}
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
        role="radio"
        aria-checked={locale === "en"}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          locale === "en"
            ? "bg-primary-dark text-white shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
