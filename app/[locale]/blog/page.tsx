import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getAllBlogItems, getTopics } from "@/lib/sanity";
import { BlogFilters } from "./blog-filters";
import type { Locale, Post, Resource } from "@/types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "blog" });

  return {
    title: t("pageTitle"),
    description: t("subtitle"),
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; argomento?: string; pagina?: string }>;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("blog");
  const tNav = await getTranslations("navigation");
  const params = await searchParams;

  const topics = await getTopics();
  const items = await getAllBlogItems(locale, {
    type: params.tipo,
    topic: params.argomento,
  });

  // Pagination
  const page = parseInt(params.pagina || "1", 10);
  const perPage = 10;
  const totalPages = Math.ceil(items.length / perPage);
  const paginatedItems = items.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: `/${locale}` },
            { label: tNav("blog") },
          ]}
        />
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={1}>{t("title")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
          </div>
        </FadeIn>

        <div className="mt-8 flex justify-center">
          <Suspense fallback={null}>
            <BlogFilters topics={topics} locale={locale} />
          </Suspense>
        </div>

        <ScrollReveal>
          <div className="mx-auto mt-12 max-w-3xl space-y-6">
            {paginatedItems.length === 0 ? (
              <p className="text-center text-foreground-muted">{t("noResults")}</p>
            ) : (
              paginatedItems.map((item) =>
                item._type === "post" ? (
                  <PostCard key={item._id} post={item as Post} locale={locale} t={t} />
                ) : (
                  <ResourceCard key={item._id} resource={item as Resource} locale={locale} t={t} />
                ),
              )
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/${locale}/blog?${new URLSearchParams({ ...params, pagina: String(page - 1) }).toString()}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground"
                >
                  {t("prevPage")}
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/${locale}/blog?${new URLSearchParams({ ...params, pagina: String(page + 1) }).toString()}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground"
                >
                  {t("nextPage")}
                </Link>
              )}
            </div>
          )}
        </ScrollReveal>
      </Container>
    </section>
  );
}

function PostCard({
  post,
  locale,
  t,
}: {
  post: Post;
  locale: Locale;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <article className="rounded-2xl border border-border/70 border-l-[3px] border-l-primary bg-surface p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary-text">
          {t("filters.postSingular")}
        </span>
        <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-foreground-muted">
          {post.topic.title[locale]}
        </span>
        <time className="text-foreground-subtle" dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
      <Link href={`/${locale}/blog/${post.slug}`} className="mt-3 block">
        <h2 className="text-lg font-semibold text-foreground hover:text-primary-text transition-colors">
          {post.title}
        </h2>
      </Link>
      {post.author && (
        <p className="mt-1 text-sm text-foreground-subtle">
          {t("publishedBy", { author: post.author })}
        </p>
      )}
      <p className="mt-2 text-foreground-muted">{post.excerpt}</p>
    </article>
  );
}

function ResourceCard({
  resource,
  locale,
  t,
}: {
  resource: Resource;
  locale: Locale;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <article className="rounded-2xl border border-border/70 border-l-[3px] border-l-secondary bg-surface p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-secondary/20 px-2.5 py-0.5 font-medium text-foreground">
          {resource.contentType}
        </span>
        <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-foreground-muted">
          {resource.topic.title[locale]}
        </span>
        <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-foreground-subtle">
          {resource.language.toUpperCase()}
        </span>
        <time className="text-foreground-subtle" dateTime={resource.publishedAt}>
          {new Date(resource.publishedAt).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-foreground">{resource.title}</h2>
      {resource.description && (
        <p className="mt-2 text-foreground-muted">{resource.description}</p>
      )}
      <a
        href={resource.fileUrl}
        download
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-text transition-colors hover:text-primary-dark"
        aria-label={`${t("download")} ${resource.title}`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {t("download")}
      </a>
    </article>
  );
}
