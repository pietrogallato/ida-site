"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Navigation } from "@/components/layout/navigation";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function Header() {
  const locale = useLocale();
  const t = useTranslations("navigation");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link
            href={`/${locale}`}
            className="flex items-baseline gap-2"
            aria-label={t("home")}
          >
            <span className="text-xl font-bold text-foreground">
              Ida Sato
            </span>
            <span className="text-sm text-foreground-muted">
              {locale === "it" ? "Psicologa" : "Psychologist"}
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <Navigation />
            <div className="ml-4 flex items-center gap-1 border-l border-border pl-4">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <LanguageSwitcher />
            <MobileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
