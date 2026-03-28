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
    "@type": "ProfessionalService",
    additionalType: "https://schema.org/MedicalBusiness",
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
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteConfig.phone,
        contactType: "customer service",
        availableLanguage: ["Italian", "English"],
      },
      {
        "@type": "ContactPoint",
        email: siteConfig.email,
        contactType: "customer service",
      },
    ],
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

export function getBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getServiceSchema(service: {
  name: string;
  description: string;
  serviceType: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": service.url,
    name: service.name,
    description: service.description,
    url: service.url,
    serviceType: service.serviceType,
    provider: {
      "@type": "ProfessionalService",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    areaServed: {
      "@type": "Country",
      name: "Italy",
    },
  };
}
