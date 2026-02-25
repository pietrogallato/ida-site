import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/i18n/config";
import { siteConfig } from "@/content/site";
import { getWebsiteSchema, getLocalBusinessSchema } from "@/lib/structured-data";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SkipLink } from "@/components/ui/skip-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const titleSuffix = locale === "it" ? "Ida Sato — Psicologa" : "Ida Sato — Psychologist";

  return {
    title: {
      default: t("title"),
      template: `%s | ${titleSuffix}`,
    },
    description: t("description"),
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        it: "/it",
        en: "/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: siteConfig.url,
      siteName: siteConfig.name,
      locale: locale === "it" ? "it_IT" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebsiteSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getLocalBusinessSchema(locale)),
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <SkipLink />
            <Header />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
          <SpeedInsights />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
