import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  const routes = [
    { path: "", priority: 1.0 },
    { path: "/chi-sono", priority: 0.8 },
    { path: "/servizi", priority: 0.8 },
    { path: "/contatti", priority: 0.8 },
    { path: "/faq", priority: 0.6 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    entries.push({
      url: `${baseUrl}/it${route.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: route.priority,
      alternates: {
        languages: {
          it: `${baseUrl}/it${route.path}`,
          en: `${baseUrl}/en${route.path}`,
        },
      },
    });

    entries.push({
      url: `${baseUrl}/en${route.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: route.priority,
      alternates: {
        languages: {
          it: `${baseUrl}/it${route.path}`,
          en: `${baseUrl}/en${route.path}`,
        },
      },
    });
  }

  return entries;
}
