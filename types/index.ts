export type Locale = "it" | "en";

export type Theme = "light" | "dark";

export type PageParams = Promise<{ locale: Locale }>;

export type ServiceIcon =
  | "User"
  | "Users"
  | "GraduationCap"
  | "Baby"
  | "Heart"
  | "Monitor";

export interface Service {
  id: string;
  icon: ServiceIcon;
  slugs: { it: string; en: string };
}

export interface FAQ {
  id: string;
}

export interface Testimonial {
  id: string;
}

export interface NavItem {
  href: string;
  labelKey: string;
}

export interface SiteConfig {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  piva: string;
  alboNumber: string;
  url: string;
  linkedin?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
  timestamp?: number;
}

export interface ContactAPIResponse {
  success: boolean;
  error?: string;
}
