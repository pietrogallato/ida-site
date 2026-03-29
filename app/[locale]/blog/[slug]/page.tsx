import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PortableText } from "@portabletext/react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CtaSection } from "@/components/sections/cta-section";
import { getPostBySlug, getPosts, getAllPostSlugs } from "@/lib/sanity";
import { getBlogPostingSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
import { portableTextComponents } from "@/lib/portable-text-components";
import type { Locale } from "@/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((s: { slug: string; language: string }) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale as Locale);
  if (!post) return {};

  const title = post.title;
  const description = post.excerpt;

  const alternates: Metadata["alternates"] = {
    canonical: `/${locale}/blog/${slug}`,
  };
  if (post.translationOf) {
    alternates.languages = {
      [post.translationOf.language]: `/${post.translationOf.language}/blog/${post.translationOf.slug}`,
      [locale]: `/${locale}/blog/${slug}`,
    };
  }

  return {
    title,
    description,
    openGraph: { title, description },
    alternates,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale as Locale);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const tNav = await getTranslations("navigation");

  const postUrl = `${siteConfig.url}/${locale}/blog/${slug}`;
  const schema = getBlogPostingSchema({
    title: post.title,
    excerpt: post.excerpt,
    author: post.author,
    publishedAt: post.publishedAt,
    url: postUrl,
  });

  // Related posts (same topic, exclude current, limit 3)
  const relatedPosts = await getPosts(locale as Locale, {
    topic: post.topic.slug,
  });
  const related = relatedPosts
    .filter((p: { _id: string }) => p._id !== post._id)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Header */}
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: `/${locale}` },
              { label: tNav("blog"), href: `/${locale}/blog` },
              { label: post.title },
            ]}
          />
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary-text">
                  {t("filters.postSingular")}
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-foreground-muted">
                  {post.topic.title[locale as Locale]}
                </span>
                <time className="text-foreground-subtle" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <Heading level={1} className="mt-4">{post.title}</Heading>
              <div
                className="mt-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary to-secondary"
                aria-hidden="true"
              />
              {post.author && (
                <p className="mt-4 text-foreground-subtle">
                  {t("publishedBy", { author: post.author })}
                </p>
              )}

              {/* Translation link */}
              {post.translationOf && (
                <div className="mt-6 rounded-lg border border-border bg-surface-alt p-4">
                  <Link
                    href={`/${post.translationOf.language}/blog/${post.translationOf.slug}`}
                    className="text-sm font-medium text-primary-text hover:text-primary-dark"
                  >
                    {t("readInOtherLanguage")}
                  </Link>
                </div>
              )}
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Body */}
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PortableText value={post.body} components={portableTextComponents} />
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CtaSection />

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-16 md:py-24">
          <Container>
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <Heading level={2}>{t("relatedPosts")}</Heading>
              </div>
              <div className="mx-auto mt-8 max-w-3xl space-y-4">
                {related.map((relPost: { _id: string; title: string; slug: string; publishedAt: string; excerpt: string }) => (
                  <Link
                    key={relPost._id}
                    href={`/${locale}/blog/${relPost.slug}`}
                    className="block rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                  >
                    <h3 className="font-semibold text-foreground hover:text-primary-text">
                      {relPost.title}
                    </h3>
                    <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                      {relPost.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </section>
      )}
    </>
  );
}
