"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { navItems } from "@/content/site";

export function Navigation() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");

  return (
    <nav aria-label={locale === "it" ? "Navigazione principale" : "Main navigation"}>
      <ul className="flex items-center gap-1">
        {navItems.map((item) => {
          const href = item.href === "/" ? `/${locale}` : `/${locale}${item.href}`;
          const isActive =
            item.href === "/"
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname.startsWith(`/${locale}${item.href}`);

          return (
            <li key={item.href}>
              <Link
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary-text"
                    : "text-foreground-muted hover:bg-surface-alt hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
