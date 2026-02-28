import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Mail, Phone, MessageCircle, MapPin, Clock, Video, Timer, Banknote, Building } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
  const locale = await getLocale();
  const t = await getTranslations("contact");
  const tNav = await getTranslations("navigation");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: `/${locale}` },
            { label: tNav("contact") },
          ]}
        />
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

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t("practical.title")}
              </h2>

              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-foreground-muted">
                  <Building
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("practical.modalitiesLabel")}
                    </p>
                    <p>{t("practical.modalitiesValue")}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 text-foreground-muted">
                  <Timer
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("practical.durationLabel")}
                    </p>
                    <p>{t("practical.durationValue")}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 text-foreground-muted">
                  <Banknote
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("practical.costLabel")}
                    </p>
                    <p>{t("practical.costValue")}</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 text-foreground-muted">
                  <Video
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("practical.paymentLabel")}
                    </p>
                    <p>{t("practical.paymentValue")}</p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t("map.title")}
            </h2>
            <div className="overflow-hidden rounded-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2808.8!2d11.45!3d45.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMeledo%20(VI)!5e0!3m2!1sit!2sit!4v1"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("map.iframeTitle")}
              />
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
