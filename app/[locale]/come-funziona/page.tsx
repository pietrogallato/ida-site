import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MessageCircle, CalendarCheck, Video, Building } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CtaSection } from "@/components/sections/cta-section";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "howItWorks" });

  return {
    title: t("pageTitle"),
    description:
      locale === "it"
        ? "Scopri come funziona un percorso psicologico con Ida Sato. Il primo colloquio, le modalità delle sedute e cosa aspettarti."
        : "Learn how a psychological journey with Ida Sato works. The first consultation, session modalities, and what to expect.",
    alternates: {
      canonical:
        locale === "it" ? "/it/come-funziona" : "/en/how-it-works",
      languages: {
        it: "/it/come-funziona",
        en: "/en/how-it-works",
      },
    },
  };
}

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const t = await getTranslations("howItWorks");
  const tNav = await getTranslations("navigation");

  const steps = [
    { key: "contact", icon: MessageCircle },
    { key: "firstSession", icon: CalendarCheck },
    { key: "path", icon: CalendarCheck },
  ];

  const modalities = [
    { key: "inPerson", icon: Building },
    { key: "online", icon: Video },
  ];

  return (
    <>
      {/* Intro */}
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: `/${locale}` },
              { label: t("pageTitle") },
            ]}
          />
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <Heading level={1}>{t("title")}</Heading>
              <p className="mt-4 text-lg text-foreground-muted">
                {t("subtitle")}
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Steps */}
      <section className="bg-surface-alt py-16 md:py-24">
        <Container>
          <ScrollReveal>
            <Heading level={2} className="text-center">
              {t("steps.title")}
            </Heading>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map(({ key, icon: Icon }, index) => (
                <Card key={key}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <Icon
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t(`steps.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    {t(`steps.${key}.text`)}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* Modalities */}
      <section className="py-16 md:py-24">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <Heading level={2}>{t("modalities.title")}</Heading>
              <p className="mt-4 text-foreground-muted">
                {t("modalities.subtitle")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mx-auto mt-12 grid max-w-2xl gap-8 sm:grid-cols-2">
              {modalities.map(({ key, icon: Icon }) => (
                <Card key={key}>
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <Icon
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t(`modalities.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    {t(`modalities.${key}.text`)}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
