export interface Service {
  id: string;
  icon: string;
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
  instagram?: string;
  linkedin?: string;
}
