"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Locale, Topic } from "@/types";

interface TopicDropdownProps {
  topics: Topic[];
  locale: Locale;
  currentTopic: string;
  onTopicChange: (slug: string) => void;
}

export function TopicDropdown({
  topics,
  locale,
  currentTopic,
  onTopicChange,
}: TopicDropdownProps) {
  const t = useTranslations("blog");
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // "All topics" is option 0, then topics follow
  const allLabel = t("allTopics");
  const options = useMemo(
    () => [
      { slug: "", label: allLabel },
      ...topics.map((topic) => ({ slug: topic.slug, label: topic.title[locale] })),
    ],
    [allLabel, topics, locale],
  );

  const selectedLabel =
    options.find((o) => o.slug === currentTopic)?.label ?? allLabel;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "Tab":
          setIsOpen(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0) {
            onTopicChange(options[highlightedIndex].slug);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
          break;
      }
    },
    [isOpen, highlightedIndex, options, onTopicChange],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function toggleOpen() {
    setIsOpen((prev) => {
      if (!prev) {
        // Opening: reset highlight to current selection
        const currentIndex = options.findIndex((o) => o.slug === currentTopic);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return !prev;
    });
  }

  if (topics.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="topic-listbox"
        aria-activedescendant={
          isOpen && highlightedIndex >= 0
            ? `topic-option-${highlightedIndex}`
            : undefined
        }
        aria-label={t("topicFilter")}
        onClick={toggleOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          isOpen ? "border-primary" : "border-border"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-foreground-subtle transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            id="topic-listbox"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_16px_40px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),0_16px_40px_-4px_rgba(0,0,0,0.3)]"
          >
            {options.map((option, index) => {
              const isSelected = option.slug === currentTopic;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={option.slug || "__all__"}
                  id={`topic-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => {
                    onTopicChange(option.slug);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-gradient-to-r from-primary/[0.08] to-accent/[0.06] font-medium text-primary-text"
                      : isHighlighted
                        ? "bg-surface-alt text-foreground"
                        : "text-foreground"
                  }`}
                >
                  {option.label}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
