import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FaqContent } from "./faq-content";
import { getFaqSchema } from "@/lib/structured-data";
import { faqs } from "@/content/faq";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "faq" });

  return {
    title: t("pageTitle"),
    description: locale === "it"
      ? "Risposte alle domande più comuni sul percorso psicologico: primo colloquio, costi, durata, sedute online e riservatezza."
      : "Answers to common questions about psychological counseling: first consultation, costs, duration, online sessions, and confidentiality.",
    alternates: {
      canonical: locale === "it" ? "/it/faq" : "/en/faq",
      languages: {
        it: "/it/faq",
        en: "/en/faq",
      },
    },
  };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const tNav = await getTranslations("navigation");
  const tFaq = await getTranslations("faq");

  const faqItems = faqs.map((faq) => ({
    question: tFaq(`${faq.id}.question`),
    answer: tFaq(`${faq.id}.answer`),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getFaqSchema(faqItems)),
        }}
      />
      <div className="pt-16 md:pt-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: `/${locale}` },
              { label: tNav("faq") },
            ]}
          />
        </Container>
      </div>
      <FaqContent />
    </>
  );
}
