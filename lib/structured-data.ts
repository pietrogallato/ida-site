import { siteConfig } from "@/content/site";

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export function getLocalBusinessSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Psychologist",
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.split(",")[0],
      addressLocality: siteConfig.city,
      addressCountry: "IT",
    },
    description:
      locale === "it"
        ? "Psicologa clinica a Padova, Meledo (VI) e Spinea (VE). Sostegno psicologico individuale, consulenze di coppia e familiari, psicologia scolastica."
        : "Clinical psychologist in Padova, Meledo (VI) and Spinea (VE), Italy. Individual psychological support, couples and family counseling, school psychology.",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    },
  };
}

export function getFaqSchema(
  items: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
