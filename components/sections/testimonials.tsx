import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getFeaturedTestimonials } from "@/lib/sanity";
import { TestimonialCarousel } from "./testimonial-carousel";
import type { Locale } from "@/types";

export async function Testimonials() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("testimonials");
  const testimonials = await getFeaturedTestimonials();

  if (testimonials.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={2}>{t("title")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-12">
            <TestimonialCarousel
              testimonials={testimonials}
              locale={locale}
              slideLabel={t("slideLabel", { current: "{current}", total: "{total}" })}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="mt-8 text-center">
            <a
              href={`/${locale}/${locale === "it" ? "recensioni" : "reviews"}`}
              className="text-sm font-medium text-primary-text transition-colors hover:text-primary-dark"
            >
              {t("readAll")} →
            </a>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
