"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, ExternalLink } from "lucide-react";

/**
 * Click-to-consent Google Maps embed — security audit F-18 / F-50.
 *
 * Rationale: the default behaviour of <iframe src="google.com/maps/embed">
 * is to transmit the visitor's IP and user agent to Google LLC (US) as soon
 * as the page is rendered, which under GDPR constitutes an extra-EU transfer
 * to a third-country processor that has not been authorised by the user.
 *
 * This component replaces the eager iframe with a privacy-friendly
 * placeholder: no outbound request to google.com is made until the user
 * explicitly clicks "Load map". At that point the iframe mounts client-side
 * and Google receives the data with the user's informed consent (GDPR
 * art. 6(1)(a)).
 *
 * The placeholder also offers a plain link to maps.google.com so users on
 * reduced-data plans, screen readers, or users who refuse consent can still
 * reach the same information without any embedded third-party content.
 */
export function MapsConsent({
  embedUrl,
  mapsLink,
}: {
  embedUrl: string;
  mapsLink: string;
}) {
  const t = useTranslations("contact.map");
  const [consented, setConsented] = useState(false);

  if (consented) {
    return (
      <div className="overflow-hidden rounded-xl">
        <iframe
          src={embedUrl}
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t("iframeTitle")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background-subtle">
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-4 p-6 text-center">
        <MapPin
          className="h-10 w-10 text-primary"
          aria-hidden="true"
        />
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {t("consentTitle")}
        </h3>
        <p className="max-w-md text-sm text-foreground-muted">
          {t("consentDescription")}
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setConsented(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t("consentButton")}
          </button>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary-text underline decoration-primary/30 hover:text-primary-dark hover:decoration-primary"
          >
            {t("openInMaps")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
