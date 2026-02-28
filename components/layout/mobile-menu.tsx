"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground lg:hidden"
          aria-label={locale === "it" ? "Apri menu" : "Open menu"}
        >
          <Menu className="h-6 w-6" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-surface p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
          <VisuallyHidden.Root>
            <Dialog.Title>
              {locale === "it" ? "Menu di navigazione" : "Navigation menu"}
            </Dialog.Title>
          </VisuallyHidden.Root>

          <div className="flex justify-end">
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground"
                aria-label={locale === "it" ? "Chiudi menu" : "Close menu"}
              >
                <X className="h-6 w-6" />
              </button>
            </Dialog.Close>
          </div>

          <nav
            className="mt-8"
            aria-label={
              locale === "it" ? "Navigazione mobile" : "Mobile navigation"
            }
          >
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => {
                const href =
                  item.href === "/"
                    ? `/${locale}`
                    : `/${locale}${item.href}`;
                const isActive =
                  item.href === "/"
                    ? pathname === `/${locale}` ||
                      pathname === `/${locale}/`
                    : pathname.startsWith(`/${locale}${item.href}`);

                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-lg px-4 py-3 text-lg font-medium transition-colors",
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

            <div className="mt-6 px-4">
              <ButtonLink
                href={`/${locale}/contatti`}
                size="lg"
                className="w-full justify-center"
              >
                {tCommon("bookConsultation")}
              </ButtonLink>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
