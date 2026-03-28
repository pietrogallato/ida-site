import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Ida Sato — Psicologa Clinica";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const title = "Ida Sato";
  const subtitle =
    locale === "it" ? "Psicologa Clinica" : "Clinical Psychologist";
  const description =
    locale === "it"
      ? "Sostegno psicologico individuale, di coppia e familiare"
      : "Individual, couples and family psychological support";
  const location = "Meledo (VI) · Spinea (VE) · Online";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #FAFAF8 0%, #F5F3EF 50%, #E5DAC6 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#6B8F71",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#1A1A19",
              lineHeight: 1.1,
              fontFamily: "serif",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 400,
              color: "#5A7A5F",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              width: "80px",
              height: "3px",
              background: "#6B8F71",
              marginTop: "8px",
              marginBottom: "8px",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#4A4A48",
              lineHeight: 1.5,
              maxWidth: "700px",
            }}
          >
            {description}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "#7A7A78",
              marginTop: "8px",
            }}
          >
            {location}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
