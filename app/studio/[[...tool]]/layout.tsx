import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — Ida Sato",
  robots: "noindex",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
