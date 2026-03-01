import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { AboutPreview } from "@/components/sections/about-preview";
import { HowItWorksPreview } from "@/components/sections/how-it-works-preview";
import { ServicesPreview } from "@/components/sections/services-preview";
import { Testimonials } from "@/components/sections/testimonials";
import { CtaSection } from "@/components/sections/cta-section";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        it: "/it",
        en: "/en",
      },
    },
  };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutPreview />
      <HowItWorksPreview />
      <ServicesPreview />
      <Testimonials />
      <CtaSection />
    </>
  );
}
