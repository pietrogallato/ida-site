import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";

export async function AboutPreview() {
  const locale = await getLocale();
  const t = await getTranslations("aboutPreview");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-alt">
            <Image
              src="/images/ida-sato.jpg"
              alt="Ida Sato, psicologa"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Text */}
          <div>
            <Heading level={2}>{t("title")}</Heading>
            <p className="mt-4 text-lg leading-relaxed text-foreground-muted">
              {t("text")}
            </p>
            <Link
              href={`/${locale}/chi-sono`}
              className="mt-6 inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary-dark"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
