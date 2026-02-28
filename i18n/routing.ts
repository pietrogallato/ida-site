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
  },
});
