import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { siteConfig } from "@/content/site";

export async function Hero() {
  const locale = await getLocale();
  const t = await getTranslations("hero");
  const tNav = await getTranslations("navigation");

  return (
    <section className="relative py-20 sm:py-28 lg:py-36">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent"
        aria-hidden="true"
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <div>
              <p className="text-sm font-medium tracking-wide text-primary-text uppercase">
                {tNav("subtitle")} — {t("alboLabel")} {siteConfig.alboNumber}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t("title")}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-foreground-muted sm:text-xl">
                {t("subtitle")}
              </p>
              <div className="mt-10">
                <ButtonLink href={`/${locale}/contatti`} size="lg">
                  {t("cta")}
                </ButtonLink>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-surface-alt lg:mx-0">
              <Image
                src="/images/ida-sato.jpg"
                alt={t("imageAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                priority
              />
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
