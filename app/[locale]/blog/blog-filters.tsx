"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { TopicDropdown } from "./topic-dropdown";
import type { Locale, Topic } from "@/types";

interface BlogFiltersProps {
  topics: Topic[];
  locale: Locale;
  counts: { all: number; posts: number; resources: number };
}

export function BlogFilters({ topics, locale, counts }: BlogFiltersProps) {
  const t = useTranslations("blog");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("tipo") || "all";
  const currentTopic = searchParams.get("argomento") || "";

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.delete("pagina");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  const typeOptions = [
    { value: "all", label: t("filters.all"), count: counts.all },
    { value: "posts", label: t("filters.posts"), count: counts.posts },
    { value: "resources", label: t("filters.resources"), count: counts.resources },
  ];

  return (
    <div className="w-full">
      {/* Desktop: tabs left, dropdown right, aligned at bottom */}
      {/* Mobile: tabs full-width on top, dropdown below */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
        {/* Type tabs with counters */}
        <div className="flex border-b-2 border-border">
          {typeOptions.map((option) => {
            const isActive = currentType === option.value;
            return (
              <button
                key={option.value}
                aria-pressed={isActive}
                onClick={() => updateFilters("tipo", option.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-5 py-2.5 text-sm transition-colors lg:flex-initial ${
                  isActive
                    ? "-mb-[2px] border-primary font-semibold text-primary-text"
                    : "-mb-[2px] border-transparent text-foreground-subtle hover:text-foreground-muted"
                }`}
              >
                {option.label}
                <span
                  className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs leading-none ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-surface-alt text-foreground-subtle"
                  }`}
                >
                  {option.count}
                  <span className="sr-only">
                    {t("filters.countLabel", { count: option.count })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Topic dropdown */}
        <div className="mt-3 w-full lg:mt-0 lg:w-auto lg:min-w-[200px]">
          <TopicDropdown
            topics={topics}
            locale={locale}
            currentTopic={currentTopic}
            onTopicChange={(slug) => updateFilters("argomento", slug)}
          />
        </div>
      </div>
    </div>
  );
}
