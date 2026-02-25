import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export async function CtaSection() {
  const locale = await getLocale();
  const t = await getTranslations("cta");

  return (
    <section className="bg-primary py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-white/80">{t("text")}</p>
          <div className="mt-8">
            <ButtonLink
              href={`/${locale}/contatti`}
              variant="secondary"
              size="lg"
            >
              {t("button")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
