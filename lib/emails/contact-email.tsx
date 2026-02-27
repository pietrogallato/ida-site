import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ContactEmailProps {
  name: string;
  email: string;
  phone?: string;
  message: string;
  receivedAt: string;
}

export function ContactEmail({
  name,
  email,
  phone,
  message,
  receivedAt,
}: ContactEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nuovo messaggio da {name}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerTitle}>Ida Sato</Text>
            <Text style={headerSubtitle}>Nuovo messaggio dal sito</Text>
          </Section>

          {/* Contact info */}
          <Section style={infoSection}>
            <Heading as="h2" style={sectionTitle}>
              Dettagli contatto
            </Heading>

            <table style={infoTable}>
              <tbody>
                <tr>
                  <td style={labelCell}>Nome</td>
                  <td style={valueCell}>{name}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Email</td>
                  <td style={valueCell}>
                    <Link href={`mailto:${email}`} style={link}>
                      {email}
                    </Link>
                  </td>
                </tr>
                {phone && (
                  <tr>
                    <td style={labelCell}>Telefono</td>
                    <td style={valueCell}>
                      <Link href={`tel:${phone.replace(/\s/g, "")}`} style={link}>
                        {phone}
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Message */}
          <Section style={messageSection}>
            <Heading as="h2" style={sectionTitle}>
              Messaggio
            </Heading>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Ricevuto il {receivedAt}
            </Text>
            <Text style={footerText}>
              Rispondi direttamente a questa email per contattare {name}.
            </Text>
            <Link href="https://idasato.it" style={footerLink}>
              idasato.it
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ===== Styles (inline — required for email clients) =====

const body: React.CSSProperties = {
  backgroundColor: "#F5F3EF",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  margin: "40px auto",
  maxWidth: "560px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
};

const header: React.CSSProperties = {
  backgroundColor: "#6B8F71",
  padding: "28px 32px",
};

const headerTitle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "22px",
  fontWeight: 700,
  margin: 0,
  lineHeight: "1.2",
};

const headerSubtitle: React.CSSProperties = {
  color: "rgba(255, 255, 255, 0.85)",
  fontSize: "14px",
  fontWeight: 400,
  margin: "4px 0 0 0",
  lineHeight: "1.4",
};

const infoSection: React.CSSProperties = {
  padding: "28px 32px 16px",
};

const sectionTitle: React.CSSProperties = {
  color: "#1A1A19",
  fontSize: "15px",
  fontWeight: 600,
  margin: "0 0 16px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const infoTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const labelCell: React.CSSProperties = {
  color: "#7A7A78",
  fontSize: "13px",
  fontWeight: 500,
  padding: "6px 16px 6px 0",
  verticalAlign: "top",
  width: "80px",
  whiteSpace: "nowrap" as const,
};

const valueCell: React.CSSProperties = {
  color: "#1A1A19",
  fontSize: "15px",
  padding: "6px 0",
  verticalAlign: "top",
};

const link: React.CSSProperties = {
  color: "#5A7A5F",
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "#E8E4DC",
  borderTop: "1px solid #E8E4DC",
  margin: "0 32px",
};

const messageSection: React.CSSProperties = {
  padding: "24px 32px",
};

const messageText: React.CSSProperties = {
  backgroundColor: "#F5F3EF",
  borderRadius: "8px",
  color: "#4A4A48",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: 0,
  padding: "16px 20px",
  whiteSpace: "pre-wrap" as const,
};

const footer: React.CSSProperties = {
  padding: "20px 32px 28px",
};

const footerText: React.CSSProperties = {
  color: "#7A7A78",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
};

const footerLink: React.CSSProperties = {
  color: "#5A7A5F",
  fontSize: "12px",
  textDecoration: "none",
};
