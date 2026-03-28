import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { User, Users, GraduationCap, Baby, Heart, Monitor, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CtaSection } from "@/components/sections/cta-section";
import { services, getServiceBySlug } from "@/content/services";
import { getServiceSchema, getFaqSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
import { ServiceFaq } from "./service-faq";
import type { Locale } from "@/types";

const iconMap: Record<string, typeof User> = {
  User, Users, GraduationCap, Baby, Heart, Monitor,
};

export function generateStaticParams({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  return services.map((service) => ({
    slug: service.slugs[params.locale as Locale],
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = getServiceBySlug(slug, locale as Locale);
  if (!service) return {};

  const t = await getTranslations({ locale, namespace: "services" });
  const title = t(`${service.id}.title`);
  const description = t(`${service.id}.description`);

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: `/${locale}/${locale === "it" ? "servizi" : "services"}/${slug}`,
      languages: {
        it: `/it/servizi/${service.slugs.it}`,
        en: `/en/services/${service.slugs.en}`,
      },
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = getServiceBySlug(slug, locale as Locale);
  if (!service) notFound();

  const t = await getTranslations("services");
  const tNav = await getTranslations("navigation");

  const Icon = iconMap[service.icon] || User;
  const servicesPath = locale === "it" ? "servizi" : "services";

  // Build FAQ items for client component and schema
  const faqItems = ["f1", "f2", "f3"].map((key) => ({
    question: t(`${service.id}.faq.${key}.question`),
    answer: t(`${service.id}.faq.${key}.answer`),
  }));

  // Build service schema
  const serviceUrl = `${siteConfig.url}/${locale}/${servicesPath}/${slug}`;
  const serviceSchema = getServiceSchema({
    name: t(`${service.id}.title`),
    description: t(`${service.id}.description`),
    serviceType: t(`${service.id}.title`),
    url: serviceUrl,
  });
  const faqSchema = getFaqSchema(faqItems);

  // Other services (exclude current)
  const otherServices = services.filter((s) => s.id !== service.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([serviceSchema, faqSchema]),
        }}
      />

      {/* Header */}
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: `/${locale}` },
              { label: tNav("services"), href: `/${locale}/${servicesPath}` },
              { label: t(`${service.id}.title`) },
            ]}
          />
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 inline-flex rounded-lg bg-primary/10 p-3">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <Heading level={1}>{t(`${service.id}.title`)}</Heading>
              <div
                className="mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary to-secondary"
                aria-hidden="true"
              />
              <div className="mt-8 space-y-4 text-lg leading-relaxed text-foreground-muted">
                <p>{t(`${service.id}.extendedDescription.p1`)}</p>
                <p>{t(`${service.id}.extendedDescription.p2`)}</p>
                <p>{t(`${service.id}.extendedDescription.p3`)}</p>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Benefits */}
      <section className="bg-surface-alt py-16 md:py-24">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl">
              <Heading level={2}>{t(`${service.id}.benefitsTitle`)}</Heading>
              <ul className="mt-8 space-y-3">
                {["b1", "b2", "b3", "b4"].map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary-text"
                      aria-hidden="true"
                    />
                    <span className="text-foreground-muted">
                      {t(`${service.id}.benefits.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl">
              <Heading level={2}>{t(`${service.id}.stepsTitle`)}</Heading>
              <div className="mt-8 space-y-8">
                {["s1", "s2", "s3"].map((key, index) => (
                  <div key={key} className="border-l-[3px] border-l-primary pl-6">
                    <p className="text-base font-bold text-primary-text">
                      {index + 1}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">
                      {t(`${service.id}.steps.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-foreground-muted">
                      {t(`${service.id}.steps.${key}.text`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-surface-alt py-16 md:py-24">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl">
              <Heading level={2}>{t(`${service.id}.faqTitle`)}</Heading>
              <div className="mt-8">
                <ServiceFaq items={faqItems} />
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* CTA */}
      <CtaSection />

      {/* Other services */}
      <section className="py-16 md:py-24">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <Heading level={2}>{t("otherServices")}</Heading>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherServices.map((other) => {
                const OtherIcon = iconMap[other.icon] || User;
                return (
                  <Link
                    key={other.id}
                    href={`/${locale}/${servicesPath}/${other.slugs[locale as Locale]}`}
                    className="block"
                  >
                    <Card interactive accentColor="primary">
                      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                        <OtherIcon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {t(`${other.id}.title`)}
                      </h3>
                      <p className="mt-2 text-foreground-muted">
                        {t(`${other.id}.description`)}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
}
