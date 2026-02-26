import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Heart, Shield, GraduationCap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("pageTitle"),
    alternates: {
      languages: {
        it: "/it/chi-sono",
        en: "/en/about",
      },
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  const qualifications = [
    t("qualifications.items.0"),
    t("qualifications.items.1"),
    t("qualifications.items.2"),
    t("qualifications.items.3"),
    t("qualifications.items.4"),
  ];

  const values = [
    {
      key: "empathy",
      icon: Heart,
    },
    {
      key: "respect",
      icon: Shield,
    },
    {
      key: "professionalism",
      icon: GraduationCap,
    },
  ];

  return (
    <>
      {/* Hero section */}
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
                priority
              />
            </div>

            <div>
              <Heading level={1}>{t("title")}</Heading>
              <p className="mt-2 text-lg text-primary">{t("subtitle")}</p>
              <p className="mt-6 text-lg leading-relaxed text-foreground-muted">
                {t("bio")}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Approach */}
      <section className="bg-surface-alt py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Heading level={2}>{t("approach.title")}</Heading>
            <p className="mt-4 text-lg leading-relaxed text-foreground-muted">
              {t("approach.text")}
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24">
        <Container>
          <Heading level={2} className="text-center">
            {t("values.title")}
          </Heading>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {values.map(({ key, icon: Icon }) => (
              <Card key={key}>
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t(`values.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {t(`values.${key}.text`)}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Qualifications */}
      <section className="bg-surface-alt py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Heading level={2}>{t("qualifications.title")}</Heading>
            <ul className="mt-6 space-y-3">
              {qualifications.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-foreground-muted"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
