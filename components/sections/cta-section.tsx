import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export async function CtaSection() {
  const locale = await getLocale();
  const t = await getTranslations("cta");

  return (
    <section className="relative bg-[linear-gradient(160deg,#4E6B54_0%,#5A7A5F_100%)] py-16 md:py-24">
      {/* Decorative top accent line */}
      <div
        className="absolute top-0 left-1/2 h-[3px] w-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-secondary to-secondary/30"
        aria-hidden="true"
      />

      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("title")}
            </h2>
            {/* Decorative separator */}
            <div
              className="mx-auto my-4 h-0.5 w-10 rounded-full bg-secondary/50"
              aria-hidden="true"
            />
            <p className="text-lg text-white/90">{t("text")}</p>
            <div className="mt-8">
              <ButtonLink
                href={`/${locale}/contatti`}
                variant="white"
                size="lg"
              >
                {t("button")}
              </ButtonLink>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
