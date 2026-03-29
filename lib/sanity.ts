import { createClient } from "next-sanity";
import type { Locale, BlogItem } from "@/types";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-03-28",
  useCdn: false,
});

export async function getPosts(
  locale: Locale,
  filters?: { topic?: string },
) {
  const hasTopicFilter = !!filters?.topic;

  return client.fetch(
    `*[_type == "post" && language == $locale ${hasTopicFilter ? '&& topic->slug.current == $topicSlug' : ''}] | order(publishedAt desc) {
      _id,
      _type,
      title,
      "slug": slug.current,
      language,
      "topic": topic->{ "title": title, "slug": slug.current },
      author,
      publishedAt,
      excerpt
    }`,
    { locale, ...(hasTopicFilter && { topicSlug: filters!.topic }) },
  );
}

export async function getPostBySlug(slug: string, locale: Locale) {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug && language == $locale][0] {
      _id,
      _type,
      title,
      "slug": slug.current,
      language,
      "translationOf": translationOf->{ "slug": slug.current, language },
      "topic": topic->{ "title": title, "slug": slug.current },
      author,
      publishedAt,
      excerpt,
      body[] {
        ...,
        _type == "image" => {
          ...,
          "url": asset->url,
          "dimensions": asset->metadata.dimensions
        }
      }
    }`,
    { slug, locale },
  );
}

export async function getResources(
  filters?: { contentType?: string; topic?: string },
) {
  const hasTypeFilter = !!filters?.contentType;
  const hasTopicFilter = !!filters?.topic;

  return client.fetch(
    `*[_type == "resource" ${hasTypeFilter ? '&& contentType == $contentType' : ''} ${hasTopicFilter ? '&& topic->slug.current == $topicSlug' : ''}] | order(publishedAt desc) {
      _id,
      _type,
      title,
      "slug": slug.current,
      language,
      contentType,
      "topic": topic->{ "title": title, "slug": slug.current },
      description,
      "fileUrl": file.asset->url,
      publishedAt
    }`,
    {
      ...(hasTypeFilter && { contentType: filters!.contentType }),
      ...(hasTopicFilter && { topicSlug: filters!.topic }),
    },
  );
}

export async function getTopics() {
  return client.fetch(
    `*[_type == "topic"] | order(title.it asc) {
      "title": title,
      "slug": slug.current
    }`,
  );
}

export async function getAllBlogItems(
  locale: Locale,
  filters?: { type?: string; topic?: string },
): Promise<BlogItem[]> {
  if (filters?.type === "posts") {
    return getPosts(locale, { topic: filters.topic });
  }

  if (filters?.type === "resources") {
    return getResources({ topic: filters.topic });
  }

  // Combined: fetch both and merge
  const hasTopicFilter = !!filters?.topic;
  const topicParams = hasTopicFilter ? { topicSlug: filters!.topic } : {};

  const posts = await client.fetch(
    `*[_type == "post" && language == $locale ${hasTopicFilter ? '&& topic->slug.current == $topicSlug' : ''}] | order(publishedAt desc) {
      _id, _type, title, "slug": slug.current, language,
      "topic": topic->{ "title": title, "slug": slug.current },
      author, publishedAt, excerpt
    }`,
    { locale, ...topicParams },
  );

  const resources = await client.fetch(
    `*[_type == "resource" ${hasTopicFilter ? '&& topic->slug.current == $topicSlug' : ''}] | order(publishedAt desc) {
      _id, _type, title, "slug": slug.current, language, contentType,
      "topic": topic->{ "title": title, "slug": slug.current },
      description, "fileUrl": file.asset->url, publishedAt
    }`,
    { ...topicParams },
  );

  return [...posts, ...resources].sort(
    (a: { publishedAt: string }, b: { publishedAt: string }) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getAllPostSlugs() {
  return client.fetch(
    `*[_type == "post"] { "slug": slug.current, language }`,
  );
}
