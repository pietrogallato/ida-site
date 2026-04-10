import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep CMS and API endpoints out of search engine indexes.
        // Security audit F-36: robots.txt is hygiene, not a security
        // boundary — Studio must still be gated at the edge.
        disallow: ["/studio/", "/api/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
