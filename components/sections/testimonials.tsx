import { getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { testimonials } from "@/content/testimonials";

export async function Testimonials() {
  const t = await getTranslations("testimonials");

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading level={2}>{t("title")}</Heading>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <Quote
                className="mb-4 h-8 w-8 text-primary/30"
                aria-hidden="true"
              />
              <blockquote className="text-foreground-muted">
                <p>{t(`${testimonial.id}.text`)}</p>
              </blockquote>
              <p className="mt-4 text-sm font-medium text-foreground">
                — {t(`${testimonial.id}.author`)}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
