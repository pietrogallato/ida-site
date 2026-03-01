import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  User,
  Users,
  GraduationCap,
  Baby,
  Heart,
  Monitor,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { services } from "@/content/services";

const iconMap: Record<string, typeof User> = {
  User,
  Users,
  GraduationCap,
  Baby,
  Heart,
  Monitor,
};

export async function ServicesPreview() {
  const locale = await getLocale();
  const t = await getTranslations("servicesPreview");
  const tServices = await getTranslations("services");

  // Show first 4 services on homepage
  const previewServices = services.slice(0, 4);

  return (
    <section className="bg-surface-alt py-16 md:py-24">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={2}>{t("title")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {previewServices.map((service) => {
              const Icon = iconMap[service.icon] || User;
              return (
                <Card key={service.id} interactive>
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <Icon
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {tServices(`${service.id}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-muted line-clamp-3">
                    {tServices(`${service.id}.description`)}
                  </p>
                </Card>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-10 text-center">
            <Link
              href={`/${locale}/servizi`}
              className="inline-flex items-center gap-2 font-medium text-primary-text transition-colors hover:text-primary-dark"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
