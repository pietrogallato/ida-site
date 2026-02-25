import type { SiteConfig, NavItem } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Ida Sato",
  email: "ida.sato@example.com",
  phone: "+39 012 345 6789",
  whatsapp: "+390123456789",
  address: "Via Example 42, 20100 Milano (MI)",
  city: "Milano",
  piva: "IT12345678901",
  alboNumber: "12345",
  url: "https://idasato.it",
};

export const navItems: NavItem[] = [
  { href: "/", labelKey: "home" },
  { href: "/chi-sono", labelKey: "about" },
  { href: "/servizi", labelKey: "services" },
  { href: "/contatti", labelKey: "contact" },
  { href: "/faq", labelKey: "faq" },
];
