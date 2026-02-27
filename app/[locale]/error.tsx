"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");

  return (
    <section className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <p className="text-6xl font-bold text-primary-text">500</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-foreground-muted">{t("text")}</p>
          <div className="mt-8">
            <Button onClick={reset}>{t("retry")}</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
