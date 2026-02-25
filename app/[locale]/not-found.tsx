import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");

  return (
    <section className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <p className="text-6xl font-bold text-primary">404</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-foreground-muted">{t("text")}</p>
          <div className="mt-8">
            <ButtonLink href={`/${locale}`}>{t("cta")}</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
