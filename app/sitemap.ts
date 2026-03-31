import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";
import { client } from "@/lib/sanity";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const routes = [
    { path: "", priority: 1.0 },
    { path: "/chi-sono", priority: 0.8 },
    { path: "/servizi", priority: 0.8 },
    { path: "/contatti", priority: 0.8 },
    { path: "/come-funziona", priority: 0.7 },
    { path: "/faq", priority: 0.6 },
    { path: "/blog", priority: 0.8 },
    { path: "/recensioni", priority: 0.7 },
    { path: "/privacy", priority: 0.3 },
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

  // Blog posts from Sanity
  const posts: { slug: string; language: string; publishedAt: string; translationSlug: string | null; translationLang: string | null }[] = await client.fetch(
    `*[_type == "post"] {
      "slug": slug.current,
      language,
      publishedAt,
      "translationSlug": translationOf->slug.current,
      "translationLang": translationOf->language
    }`,
  );

  for (const post of posts) {
    const langPrefix = post.language === "it" ? "it" : "en";
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}/${langPrefix}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: 0.6,
    };

    if (post.translationSlug && post.translationLang) {
      entry.alternates = {
        languages: {
          [post.language]: `${baseUrl}/${post.language}/blog/${post.slug}`,
          [post.translationLang]: `${baseUrl}/${post.translationLang}/blog/${post.translationSlug}`,
        },
      };
    }

    entries.push(entry);
  }

  return entries;
}
