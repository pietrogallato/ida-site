import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, MessageCircle, Users, TrendingUp } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const steps = [
  { key: "contact", icon: MessageCircle },
  { key: "firstSession", icon: Users },
  { key: "path", icon: TrendingUp },
] as const;

export async function HowItWorksPreview() {
  const locale = await getLocale();
  const t = await getTranslations("howItWorksPreview");

  return (
    <section className="bg-surface-alt py-16 md:py-24">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={2}>{t("title")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollReveal key={step.key} delay={index * 0.1}>
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <step.icon
                    className="h-6 w-6 text-primary-text"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-sm font-medium text-primary-text">
                  {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-2 text-foreground-muted">
                  {t(`steps.${step.key}.text`)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="mt-10 text-center">
            <Link
              href={`/${locale}/come-funziona`}
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
