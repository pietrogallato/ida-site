"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale, Topic } from "@/types";

interface BlogFiltersProps {
  topics: Topic[];
  locale: Locale;
}

export function BlogFilters({ topics, locale }: BlogFiltersProps) {
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
    { value: "all", label: t("filters.all") },
    { value: "posts", label: t("filters.posts") },
    { value: "resources", label: t("filters.resources") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Type filter pills */}
      <div className="flex gap-1 rounded-full border border-border bg-surface-alt p-1">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            aria-pressed={currentType === option.value}
            onClick={() => updateFilters("tipo", option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              currentType === option.value
                ? "bg-primary-dark text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Topic dropdown */}
      <div>
        <label htmlFor="topic-filter" className="sr-only">
          {t("topicFilter")}
        </label>
        <select
          id="topic-filter"
          value={currentTopic}
          onChange={(e) => updateFilters("argomento", e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">{t("allTopics")}</option>
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.title[locale]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
