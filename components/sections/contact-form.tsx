"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const t = useTranslations("contact.form");
  const tCommon = useTranslations("common");

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const mountTime = useRef(0);

  useEffect(() => {
    mountTime.current = Date.now();
  }, []);

  function validate(formData: FormData): FormErrors {
    const errs: FormErrors = {};
    if (!formData.get("name")) errs.name = t("errors.nameRequired");
    const email = formData.get("email") as string;
    if (!email) errs.email = t("errors.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t("errors.emailInvalid");
    if (!formData.get("message")) errs.message = t("errors.messageRequired");
    return errs;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Anti-bot: honeypot field filled → silent fake success
    if (formData.get("website")) {
      setSubmitted(true);
      return;
    }

    // Anti-bot: form submitted too fast (< 2s) → silent fake success
    if (mountTime.current && Date.now() - mountTime.current < 2000) {
      setSubmitted(true);
      return;
    }

    const errs = validate(formData);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-success/30 bg-success/10 p-6 text-center"
        role="alert"
      >
        <p className="font-medium text-foreground">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot — invisible to humans, bots fill it automatically */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          {t("name")} <span className="text-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={!!errors.name}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-error" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {t("email")} <span className="text-error">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={!!errors.email}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone (optional) */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground">
          {t("phone")}{" "}
          <span className="text-foreground-subtle">({tCommon("optional")})</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-foreground"
        >
          {t("message")} <span className="text-error">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder={t("messagePlaceholder")}
          aria-describedby={errors.message ? "message-error" : undefined}
          aria-invalid={!!errors.message}
          className="mt-1 block w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-error" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
