import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { FadeIn } from "@/components/ui/fade-in";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { siteConfig } from "@/content/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("pageTitle"),
    description: locale === "it"
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

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations("privacy");
  const tNav = await getTranslations("navigation");

  const sections = [
    "controller",
    "dataCollected",
    "analytics",
    "rights",
    "retention",
    "cookies",
  ] as const;

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
            <p className="mt-2 text-sm text-foreground-subtle">{t("lastUpdated")}</p>
            <p className="mt-6 text-lg text-foreground-muted">{t("intro")}</p>

            <div className="mt-12 space-y-10">
              {sections.map((section) => (
                <div key={section}>
                  <h2 className="text-xl font-semibold text-foreground">
                    {t(`${section}.title`)}
                  </h2>
                  <p className="mt-3 text-foreground-muted">
                    {t(`${section}.text`, {
                      piva: siteConfig.piva,
                      address: siteConfig.address,
                      email: siteConfig.email,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
