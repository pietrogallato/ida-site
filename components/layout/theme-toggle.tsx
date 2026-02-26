"use client";

import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("common");

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm font-medium text-foreground-muted transition-all hover:border-primary hover:text-foreground active:scale-95"
      aria-label={t("toggleTheme")}
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          <span className="hidden sm:inline">{t("dark")}</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">{t("light")}</span>
        </>
      )}
    </button>
  );
}
