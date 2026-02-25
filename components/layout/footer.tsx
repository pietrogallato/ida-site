import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { siteConfig, navItems } from "@/content/site";

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const tNav = await getTranslations("navigation");

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-alt" role="contentinfo">
      <Container>
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-foreground">Ida Sato</p>
            <p className="mt-2 text-sm text-foreground-muted">
              {t("description")}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="font-semibold text-foreground">{t("quickLinks")}</p>
            <nav aria-label={locale === "it" ? "Link rapidi" : "Quick links"}>
              <ul className="mt-3 flex flex-col gap-2">
                {navItems.map((item) => {
                  const href =
                    item.href === "/"
                      ? `/${locale}`
                      : `/${locale}${item.href}`;
                  return (
                    <li key={item.href}>
                      <Link
                        href={href}
                        className="text-sm text-foreground-muted transition-colors hover:text-primary"
                      >
                        {tNav(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Contacts */}
          <div>
            <p className="font-semibold text-foreground">{t("contacts")}</p>
            <ul className="mt-3 flex flex-col gap-3">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-6 text-center text-xs text-foreground-subtle">
          <p>
            {t("legal", {
              piva: siteConfig.piva,
              alboNumber: siteConfig.alboNumber,
            })}
          </p>
          <p className="mt-1">
            {t("copyright", { year: String(year) })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
