"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const nextLocale = locale === "it" ? "en" : "it";

    // Replace the current locale prefix in the pathname
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as "it" | "en")) {
      segments[1] = nextLocale;
    }
    const newPath = segments.join("/") || "/";

    router.push(newPath);
  }

  return (
    <button
      onClick={switchLocale}
      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground"
      aria-label={t("switchLanguage")}
    >
      {locale === "it" ? "EN" : "IT"}
    </button>
  );
}
