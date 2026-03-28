import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export async function AboutPreview() {
  const locale = await getLocale();
  const t = await getTranslations("aboutPreview");

  return (
    <section className="bg-surface-alt py-16 md:py-24">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={2}>{t("title")}</Heading>
            <div
              className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary to-secondary"
              aria-hidden="true"
            />
            <p className="mt-6 text-lg leading-relaxed text-foreground-muted">
              {t("text")}
            </p>
            <div className="mt-8">
              <ButtonLink href={`/${locale}/chi-sono`} variant="outline">
                {t("cta")}
              </ButtonLink>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
