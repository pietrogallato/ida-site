import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { ContactEmail } from "@/lib/emails/contact-email";

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.CONTACT_EMAIL) {
  console.warn("CONTACT_EMAIL env variable is not set");
}
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

// In-memory rate limiting (per IP, 5 requests per 15 minutes)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

interface ContactBody {
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
  timestamp?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body: ContactBody = await request.json();

    // Anti-bot: honeypot
    if (body.website) {
      return NextResponse.json({ success: true });
    }

    // Anti-bot: too fast (< 2s)
    if (body.timestamp && Date.now() - body.timestamp < 2000) {
      return NextResponse.json({ success: true });
    }

    // Check required env vars
    if (!CONTACT_EMAIL) {
      console.error("CONTACT_EMAIL is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
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

    // Sanitize replyTo to prevent header injection
    const sanitizedEmail = body.email.replace(/[\r\n]/g, "");

    // Format timestamp
    const now = new Date();
    const receivedAt = now.toLocaleString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });

    const sanitizedName = body.name.slice(0, 200);
    const sanitizedPhone = body.phone?.slice(0, 30);
    const sanitizedMessage = body.message.slice(0, 5000);

    const { error } = await resend.emails.send({
      from: "Sito Ida Sato <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: sanitizedEmail,
      subject: `Nuovo messaggio da ${sanitizedName.slice(0, 100)}`,
      react: ContactEmail({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        message: sanitizedMessage,
        receivedAt,
      }),
      text: [
        `Nome: ${sanitizedName}`,
        `Email: ${sanitizedEmail}`,
        sanitizedPhone ? `Telefono: ${sanitizedPhone}` : null,
        "",
        "Messaggio:",
        sanitizedMessage,
        "",
        `Ricevuto: ${receivedAt}`,
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
