"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import type { Locale, Testimonial } from "@/types";

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  locale: Locale;
  slideLabel: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} su 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function TestimonialCarousel({
  testimonials,
  locale,
  slideLabel,
}: TestimonialCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = testimonials.length;

  // Track active slide via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(
              (entry.target as HTMLElement).dataset.index,
            );
            if (!isNaN(index)) setActiveIndex(index);
          }
        }
      },
      { root: container, threshold: 0.6 },
    );

    const slides = container.querySelectorAll("[data-index]");
    slides.forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, []);

  // Auto-advance (respects reduced motion)
  const scrollTo = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) return;
      const slide = container.children[index] as HTMLElement | undefined;
      if (slide) {
        container.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
      }
    },
    [],
  );

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        scrollTo(next);
        return next;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [total, isPaused, scrollTo]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = activeIndex > 0 ? activeIndex - 1 : total - 1;
      scrollTo(prev);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (activeIndex + 1) % total;
      scrollTo(next);
    }
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={slideLabel.replace("{current}", String(activeIndex + 1)).replace("{total}", String(total))}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-2xl"
    >
      {/* Slides container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial._id}
            data-index={index}
            role="group"
            aria-roledescription="slide"
            aria-label={slideLabel.replace("{current}", String(index + 1)).replace("{total}", String(total))}
            className="w-full flex-shrink-0 snap-start px-4"
          >
            <div className="mx-auto max-w-xl text-center">
              <div className="flex justify-center">
                <Stars rating={testimonial.rating} />
              </div>
              <blockquote className="mt-6 text-lg leading-relaxed text-foreground-muted italic">
                <p>&ldquo;{testimonial.text[locale]}&rdquo;</p>
              </blockquote>
              <p className="mt-4 text-sm font-semibold text-primary-text">
                — {testimonial.author}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dot navigation */}
      {total > 1 && (
        <div
          role="tablist"
          className="mt-8 flex justify-center gap-2"
          aria-label="Slides"
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={slideLabel.replace("{current}", String(index + 1)).replace("{total}", String(total))}
              onClick={() => scrollTo(index)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                index === activeIndex
                  ? "bg-primary"
                  : "bg-border hover:bg-foreground-subtle"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
