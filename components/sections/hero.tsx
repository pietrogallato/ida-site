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
        className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-primary/8 to-secondary/12"
        aria-hidden="true"
      />

      <Container>
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-center">
          <FadeIn>
            <div>
              <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-primary-text uppercase">
                <span className="inline-block h-px w-6 bg-primary-text" aria-hidden="true" />
                {tNav("subtitle")} — {t("alboLabel")} {siteConfig.alboNumber}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t("title")}
              </h1>
              <div
                className="mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary to-secondary"
                aria-hidden="true"
              />
              <p className="mt-6 text-lg leading-relaxed text-foreground-muted sm:text-xl">
                {t("subtitle")}
              </p>
              <div className="mt-10 hidden lg:block">
                <ButtonLink
                  href={`/${locale}/contatti`}
                  size="lg"
                  className="shadow-[0_4px_12px_rgba(107,143,113,0.25)]"
                >
                  {t("cta")}
                </ButtonLink>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="relative mx-auto w-full max-w-md lg:mx-0">
              {/* Decorative offset border — desktop only */}
              <div
                className="absolute top-2 left-2 -right-2 -bottom-2 rounded-2xl border-2 border-primary/15 -z-10 hidden lg:block"
                aria-hidden="true"
              />
              {/* Photo container */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-alt shadow-xl">
                <Image
                  src="/images/ida-sato.jpg"
                  alt={t("imageAlt")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                  priority
                />
              </div>
            </div>
          </FadeIn>

          <div className="lg:hidden">
            <ButtonLink
              href={`/${locale}/contatti`}
              size="lg"
              className="shadow-[0_4px_12px_rgba(107,143,113,0.25)]"
            >
              {t("cta")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
