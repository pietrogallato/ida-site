import type { Service, Locale } from "@/types";

export const services: Service[] = [
  { id: "individual", icon: "User", slugs: { it: "sostegno-individuale", en: "individual-support" } },
  { id: "couples", icon: "Users", slugs: { it: "consulenza-coppia", en: "couples-counseling" } },
  { id: "school", icon: "GraduationCap", slugs: { it: "psicologia-scolastica", en: "school-psychology" } },
  { id: "parenting", icon: "Baby", slugs: { it: "sostegno-genitorialita", en: "parenting-support" } },
  { id: "youth", icon: "Heart", slugs: { it: "supporto-giovani", en: "youth-support" } },
  { id: "online", icon: "Monitor", slugs: { it: "sedute-online", en: "online-sessions" } },
];

export function getServiceBySlug(slug: string, locale: Locale): Service | undefined {
  return services.find((s) => s.slugs[locale] === slug);
}
