import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames: {
    "/": "/",
    "/chi-sono": {
      it: "/chi-sono",
      en: "/about",
    },
    "/servizi": {
      it: "/servizi",
      en: "/services",
    },
    "/servizi/[slug]": {
      it: "/servizi/[slug]",
      en: "/services/[slug]",
    },
    "/contatti": {
      it: "/contatti",
      en: "/contact",
    },
    "/come-funziona": {
      it: "/come-funziona",
      en: "/how-it-works",
    },
    "/faq": "/faq",
    "/privacy": {
      it: "/privacy",
      en: "/privacy",
    },
    "/recensioni": {
      it: "/recensioni",
      en: "/reviews",
    },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
  },
});
