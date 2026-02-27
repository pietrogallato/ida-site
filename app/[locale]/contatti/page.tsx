import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Mail, Phone, MessageCircle, MapPin, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { siteConfig } from "@/content/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: t("pageTitle"),
    description: locale === "it"
      ? "Contatta Ida Sato per un primo colloquio conoscitivo. Email, telefono, WhatsApp o modulo di contatto. Studi a Meledo (VI) e Spinea (VE)."
      : "Contact Ida Sato for an initial consultation. Email, phone, WhatsApp, or contact form. Offices in Meledo (VI) and Spinea (VE).",
    alternates: {
      canonical: locale === "it" ? "/it/contatti" : "/en/contact",
      languages: {
        it: "/it/contatti",
        en: "/en/contact",
      },
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={1}>{t("title")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
          </div>
        </FadeIn>

        <ScrollReveal>
        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          {/* Contact form */}
          <div>
            <ContactForm />
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t("info.title")}
              </h2>

              <ul className="space-y-4">
                <li>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-start gap-3 text-foreground-muted transition-colors hover:text-primary-text"
                  >
                    <Mail
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t("info.email")}
                      </p>
                      <p>{siteConfig.email}</p>
                    </div>
                  </a>
                </li>

                <li>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="flex items-start gap-3 text-foreground-muted transition-colors hover:text-primary-text"
                  >
                    <Phone
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t("info.phone")}
                      </p>
                      <p>{siteConfig.phone}</p>
                    </div>
                  </a>
                </li>

                <li>
                  <a
                    href={`https://wa.me/${siteConfig.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-foreground-muted transition-colors hover:text-primary-text"
                  >
                    <MessageCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t("info.whatsapp")}
                      </p>
                      <p>{t("info.whatsappNote")}</p>
                    </div>
                  </a>
                </li>

                <li className="flex items-start gap-3 text-foreground-muted">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("info.address")}
                    </p>
                    <p>{siteConfig.address}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 text-foreground-muted">
                  <Clock
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("info.hours")}
                    </p>
                    <p>{t("info.hoursValue")}</p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
