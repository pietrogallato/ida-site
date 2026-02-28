import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { User, Users, GraduationCap, Baby, Heart, Monitor } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { services } from "@/content/services";

const iconMap: Record<string, typeof User> = {
  User,
  Users,
  GraduationCap,
  Baby,
  Heart,
  Monitor,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "services" });

  return {
    title: t("pageTitle"),
    description: locale === "it"
      ? "Sostegno psicologico individuale, consulenze di coppia e familiari, psicologia scolastica, supporto alla genitorialità e sedute online."
      : "Individual psychological support, couples and family counseling, school psychology, parenting support, and online sessions.",
    alternates: {
      canonical: locale === "it" ? "/it/servizi" : "/en/services",
      languages: {
        it: "/it/servizi",
        en: "/en/services",
      },
    },
  };
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const t = await getTranslations("services");
  const tNav = await getTranslations("navigation");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: `/${locale}` },
            { label: tNav("services") },
          ]}
        />
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={1}>{t("title")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
          </div>
        </FadeIn>

        <ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || User;
              return (
                <Card key={service.id}>
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <Icon
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {t(`${service.id}.title`)}
                  </h2>
                  <p className="mt-2 text-foreground-muted">
                    {t(`${service.id}.description`)}
                  </p>
                </Card>
              );
            })}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
