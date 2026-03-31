import type { PortableTextBlock } from "sanity";

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
  _id: string;
  text: { it: string; en: string };
  author: string;
  rating: number;
  source: "manual" | "google";
  order?: number;
  publishedAt?: string;
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

export interface Topic {
  title: { it: string; en: string };
  slug: string;
}

export interface Post {
  _id: string;
  _type: "post";
  title: string;
  slug: string;
  language: Locale;
  translationOf?: { slug: string; language: Locale } | null;
  topic: Topic;
  author: string;
  publishedAt: string;
  excerpt: string;
  body: PortableTextBlock[];
}

export interface Resource {
  _id: string;
  _type: "resource";
  title: string;
  slug: string;
  language: Locale;
  contentType: "esercizi" | "guida" | "scheda";
  topic: Topic;
  description: string;
  fileUrl: string;
  publishedAt: string;
}

export type BlogItem = Post | Resource;
