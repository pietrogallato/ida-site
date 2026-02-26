import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "pietrogallato@gmail.com";

interface ContactBody {
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
  timestamp?: number;
}

export async function POST(request: Request) {
  try {
    const body: ContactBody = await request.json();

    // Anti-bot: honeypot
    if (body.website) {
      return NextResponse.json({ success: true });
    }

    // Anti-bot: too fast (< 2s)
    if (body.timestamp && Date.now() - body.timestamp < 2000) {
      return NextResponse.json({ success: true });
    }

    // Server-side validation
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "Sito Ida Sato <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: body.email,
      subject: `Nuovo messaggio da ${body.name}`,
      text: [
        `Nome: ${body.name}`,
        `Email: ${body.email}`,
        body.phone ? `Telefono: ${body.phone}` : null,
        "",
        "Messaggio:",
        body.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("Contact API error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
