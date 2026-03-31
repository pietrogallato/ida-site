import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { FadeIn } from "@/components/ui/fade-in";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getAllTestimonials, getTestimonialStats } from "@/lib/sanity";
import { getAggregateRatingSchema } from "@/lib/structured-data";
import type { Locale } from "@/types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "testimonials" });

  return {
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    alternates: {
      canonical: `/${locale}/${locale === "it" ? "recensioni" : "reviews"}`,
      languages: {
        it: "/it/recensioni",
        en: "/en/reviews",
      },
    },
  };
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex gap-0.5" aria-label={`${rating} su 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("testimonials");
  const tNav = await getTranslations("navigation");

  const [testimonials, stats] = await Promise.all([
    getAllTestimonials(),
    getTestimonialStats(),
  ]);

  const averageRating =
    stats.count > 0
      ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.count
      : 0;

  const structuredData =
    stats.count > 0
      ? getAggregateRatingSchema({
          ratingValue: Math.round(averageRating * 10) / 10,
          reviewCount: stats.count,
        })
      : null;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: `/${locale}` },
            { label: tNav("testimonials") },
          ]}
        />

        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <Heading level={1}>{t("pageTitle")}</Heading>
            <p className="mt-4 text-lg text-foreground-muted">
              {t("pageSubtitle")}
            </p>
          </div>
        </FadeIn>

        {/* Aggregate summary */}
        {stats.count > 0 && (
          <FadeIn delay={0.1}>
            <div className="mx-auto mt-10 max-w-sm text-center">
              <div className="font-heading text-5xl font-bold text-foreground">
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-2 flex justify-center">
                <Stars rating={averageRating} size="lg" />
              </div>
              <p className="mt-2 text-sm text-foreground-muted">
                {t("basedOn", { count: stats.count })}
              </p>
            </div>
          </FadeIn>
        )}

        {/* Reviews list */}
        <div className="mx-auto mt-12 max-w-2xl space-y-6">
          {testimonials.length === 0 ? (
            <p className="text-center text-foreground-muted">
              {t("noTestimonials")}
            </p>
          ) : (
            testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial._id} delay={index * 0.05}>
                <article className="rounded-2xl border border-border/70 bg-surface p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {testimonial.author}
                    </span>
                    <Stars rating={testimonial.rating} />
                  </div>
                  <blockquote className="mt-3 leading-relaxed text-foreground-muted italic">
                    <p>&ldquo;{testimonial.text[locale]}&rdquo;</p>
                  </blockquote>
                  {testimonial.publishedAt && (
                    <time
                      className="mt-3 block text-xs text-foreground-subtle"
                      dateTime={testimonial.publishedAt}
                    >
                      {new Date(testimonial.publishedAt).toLocaleDateString(
                        locale,
                        { year: "numeric", month: "long" },
                      )}
                    </time>
                  )}
                </article>
              </ScrollReveal>
            ))
          )}
        </div>

        {/* Structured data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Container>
    </section>
  );
}
