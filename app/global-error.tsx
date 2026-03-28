"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#FAFAF8",
          color: "#1A1A19",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#5A7A5F",
              margin: "0 0 16px",
            }}
          >
            500
          </p>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            Qualcosa è andato storto
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#4A4A48",
              margin: "0 0 32px",
            }}
          >
            Si è verificato un errore inaspettato. Riprova.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#6B8F71",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
