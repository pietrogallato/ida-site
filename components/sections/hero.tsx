import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export async function Hero() {
  const locale = await getLocale();
  const t = await getTranslations("hero");

  return (
    <section className="relative py-20 sm:py-28 lg:py-36">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent"
        aria-hidden="true"
      />

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground-muted sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <ButtonLink href={`/${locale}/contatti`} size="lg">
              {t("cta")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
