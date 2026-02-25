"use client";

import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common");

  function cycle() {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  }

  const Icon = theme === "system" ? Monitor : theme === "light" ? Sun : Moon;

  return (
    <button
      onClick={cycle}
      className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground"
      aria-label={t("toggleTheme")}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
