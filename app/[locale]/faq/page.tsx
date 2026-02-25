"use client";

import { useTranslations } from "next-intl";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { faqs } from "@/content/faq";

export default function FaqPage() {
  const t = useTranslations("faq");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading level={1}>{t("title")}</Heading>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion.Root type="single" collapsible className="space-y-3">
            {faqs.map((faq) => (
              <Accordion.Item
                key={faq.id}
                value={faq.id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-4 text-left font-medium text-foreground transition-colors hover:text-primary">
                    {t(`${faq.id}.question`)}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-foreground-subtle transition-transform duration-200 group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="px-6 pb-4 text-foreground-muted">
                    {t(`${faq.id}.answer`)}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </Container>
    </section>
  );
}
