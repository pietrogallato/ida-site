import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  User,
  Shield,
  ClipboardList,
  Globe,
  BarChart3,
  Cookie,
  Clock,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { siteConfig } from "@/content/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("pageTitle"),
    description:
      locale === "it"
        ? "Informativa sulla privacy e trattamento dei dati personali del sito di Ida Sato, psicologa clinica."
        : "Privacy policy and personal data processing information for Ida Sato's website, clinical psychologist.",
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        it: "/it/privacy",
        en: "/en/privacy",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

interface PrivacySection {
  key: string;
  icon: LucideIcon;
}

const sections: PrivacySection[] = [
  { key: "controller", icon: User },
  { key: "legalBasis", icon: Shield },
  { key: "dataCollected", icon: ClipboardList },
  { key: "thirdParty", icon: Globe },
  { key: "analytics", icon: BarChart3 },
  { key: "cookies", icon: Cookie },
  { key: "retention", icon: Clock },
  { key: "rights", icon: Scale },
];

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations("privacy");
  const tNav = await getTranslations("navigation");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: `/${locale}` },
            { label: t("pageTitle") },
          ]}
        />
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <Heading level={1}>{t("title")}</Heading>
            <p className="mt-2 text-sm text-foreground-subtle">
              {t("lastUpdated")}
            </p>
            <p className="mt-6 text-lg text-foreground-muted">{t("intro")}</p>

            {/* Table of Contents */}
            <nav
              aria-label={t("tableOfContents")}
              className="mt-8 rounded-xl border border-border bg-surface-alt/50 p-5"
            >
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground-subtle">
                {t("tableOfContents")}
              </p>
              <ol className="list-inside list-decimal space-y-1 text-sm">
                {sections.map(({ key }) => (
                  <li key={key}>
                    <a
                      href={`#${key}`}
                      className="text-primary-text hover:underline"
                    >
                      {t(`${key}.title`)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </FadeIn>

        {/* Sections */}
        <div className="mx-auto mt-12 max-w-3xl">
          {sections.map(({ key, icon: Icon }, index) => (
            <ScrollReveal key={key} delay={index * 0.05}>
              <div
                id={key}
                className="scroll-mt-24 border-b border-border py-8 last:border-b-0"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <Heading
                    level={2}
                    className="text-xl font-semibold sm:text-2xl"
                  >
                    {t(`${key}.title`)}
                  </Heading>
                </div>
                <p className="pl-12 leading-relaxed text-foreground-muted">
                  {t(`${key}.text`, {
                    piva: siteConfig.piva,
                    address: siteConfig.address,
                    email: siteConfig.email,
                    phone: siteConfig.phone,
                    alboNumber: siteConfig.alboNumber,
                  })}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
