import type { SiteConfig, NavItem } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Ida Sato",
  email: "idasato1@gmail.com",
  phone: "+39 334 5029289",
  whatsapp: "+393345029289",
  address: "Meledo (VI) e Spinea (VE)",
  city: "Padova",
  piva: "IT12345678901",
  alboNumber: "13939",
  url: "https://idasato.it",
  instagram: "https://www.instagram.com/idasato.psicologa/",
  linkedin: "https://www.linkedin.com/in/ida-sato/",
};

export const navItems: NavItem[] = [
  { href: "/", labelKey: "home" },
  { href: "/chi-sono", labelKey: "about" },
  { href: "/servizi", labelKey: "services" },
  { href: "/faq", labelKey: "faq" },
];
