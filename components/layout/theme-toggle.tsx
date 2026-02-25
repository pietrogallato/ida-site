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
      className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground"
      aria-label={t("toggleTheme")}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
