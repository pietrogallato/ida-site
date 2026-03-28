"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

interface ServiceFaqProps {
  items: { question: string; answer: string }[];
}

export function ServiceFaq({ items }: ServiceFaqProps) {
  return (
    <Accordion.Root type="single" collapsible className="space-y-3">
      {items.map((item, index) => (
        <Accordion.Item
          key={index}
          value={`faq-${index}`}
          className="overflow-hidden rounded-xl border border-border bg-surface"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-4 text-left font-medium text-foreground transition-colors hover:text-primary-text">
              {item.question}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-foreground-subtle transition-transform duration-200 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="px-6 pb-4 text-foreground-muted">
              {item.answer}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
