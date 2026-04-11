"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { X, ShieldCheck } from "lucide-react";
import { useAnalyticsOptOut } from "@/lib/analytics-consent";

/**
 * Tracking preferences dialog — security audit F-17 / F-48 (Path A).
 *
 * Exposes a single button that opens a modal describing the analytics
 * configuration of the site (Vercel Analytics + Speed Insights,
 * cookieless, aggregated) and lets the user opt out via a toggle.
 * The component is self-contained: any server page or client page can
 * render <TrackingPreferencesButton /> to get a link/button styled
 * consistently with the rest of the site.
 *
 * The dialog reads and writes the opt-out state through the shared
 * useAnalyticsOptOut hook, so the <AnalyticsGate /> in the root layout
 * reacts immediately when the toggle changes.
 */

type Variant = "link" | "button";

export function TrackingPreferencesButton({
  variant = "link",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("tracking");

  const triggerClasses =
    variant === "button"
      ? `inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className ?? ""}`
      : `underline transition-colors hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm ${className ?? ""}`;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={triggerClasses}>
          {t("manageLink")}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <ShieldCheck className="h-5 w-5" />
              </span>
              <Dialog.Title className="font-heading text-xl font-semibold text-foreground">
                {t("dialogTitle")}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-surface-alt hover:text-foreground"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-4 text-sm leading-relaxed text-foreground-muted">
            {t("dialogDescription")}
          </Dialog.Description>

          <TrackingToggleControl />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TrackingToggleControl() {
  const { optedOut, setOptedOut } = useAnalyticsOptOut();
  const t = useTranslations("tracking");

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface-alt p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">{t("optionLabel")}</p>
          <p className="mt-1 text-xs text-foreground-muted">
            {optedOut ? t("statusDisabled") : t("statusEnabled")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!optedOut}
          onClick={() => setOptedOut(!optedOut)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            optedOut ? "bg-border" : "bg-primary"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
              optedOut ? "translate-x-0" : "translate-x-5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
