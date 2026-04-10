import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { ContactEmail } from "@/lib/emails/contact-email";
import { env } from "@/lib/env";
import type { ContactFormData, ContactAPIResponse } from "@/types";

const resend = new Resend(env.RESEND_API_KEY);

if (!env.CONTACT_EMAIL) {
  console.warn("CONTACT_EMAIL env variable is not set");
}
const CONTACT_EMAIL = env.CONTACT_EMAIL;

// In-memory rate limiting (per IP, 5 requests per 15 minutes).
// NOTE: on Vercel serverless this state is per-lambda-instance — see
// security audit F-01. A distributed rate limiter (Vercel Firewall /
// Upstash Redis) is tracked as remediation. The cleanup loop below
// bounds memory growth for the time being (F-05).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
// Hard cap on the number of tracked IPs to bound memory on a warm lambda.
const RATE_LIMIT_MAX_ENTRIES = 10_000;

function pruneRateLimitMap(now: number) {
  // Remove expired entries first.
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
  // If still over cap, evict oldest entries by resetAt ascending.
  if (rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
    const sorted = [...rateLimitMap.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt,
    );
    const toEvict = sorted.length - RATE_LIMIT_MAX_ENTRIES;
    for (let i = 0; i < toEvict; i++) {
      rateLimitMap.delete(sorted[i][0]);
    }
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  pruneRateLimitMap(now);

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Strip ASCII control characters (CR/LF/TAB/NUL) that could be abused for
// header injection in email fields — defence in depth on top of the Resend
// API's own normalization. Security audit F-03.
function stripCtl(value: string): string {
  return value.replace(/[\r\n\t\0\v\f]/g, " ").trim();
}

const RESEND_TIMEOUT_MS = 8000;

export async function POST(request: NextRequest) {
  try {
    // Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Invalid content type" }, { status: 415 });
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const body: ContactFormData = await request.json();

    // Anti-bot: honeypot
    if (body.website) {
      return NextResponse.json<ContactAPIResponse>({ success: true });
    }

    // Anti-bot: too fast (< 2s)
    if (body.timestamp && Date.now() - body.timestamp < 2000) {
      return NextResponse.json<ContactAPIResponse>({ success: true });
    }

    // Check required env vars
    if (!CONTACT_EMAIL) {
      console.error("CONTACT_EMAIL is not configured");
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // Server-side validation
    if (!body.name?.trim()) {
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Valid email is required" }, { status: 400 });
    }
    if (!body.message?.trim()) {
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Message is required" }, { status: 400 });
    }
    // Phone is optional, but when present it must look like a phone number.
    // Accepts digits, spaces, dots, dashes, parentheses, and a leading "+".
    // Length is bounded between 6 and 20 characters. Security audit F-07.
    if (body.phone && body.phone.trim()) {
      const phoneTrimmed = body.phone.trim();
      if (!/^\+?[\d\s().-]{6,20}$/.test(phoneTrimmed)) {
        return NextResponse.json<ContactAPIResponse>(
          { success: false, error: "Invalid phone number" },
          { status: 400 },
        );
      }
    }

    // Sanitize all user-controlled strings that will flow into the email
    // (subject, replyTo, body). Even though Resend's JSON API normalizes
    // headers, stripping control chars here is defence in depth. Security
    // audit F-03.
    const sanitizedName = stripCtl(body.name).slice(0, 200);
    const sanitizedEmail = body.email.replace(/[\r\n]/g, "").trim();
    const sanitizedPhone = body.phone ? stripCtl(body.phone).slice(0, 30) : undefined;
    const sanitizedMessage = body.message.slice(0, 5000);

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

    // Bound the Resend call so a hanging upstream cannot tie up a lambda
    // invocation indefinitely. Security audit F-09.
    const sendPromise = resend.emails.send({
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

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error("Resend request timed out")),
        RESEND_TIMEOUT_MS,
      );
    });

    let raceResult: Awaited<typeof sendPromise>;
    try {
      raceResult = await Promise.race([sendPromise, timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
    const { error } = raceResult;

    if (error) {
      // Log only a stable tag — never the full error object, which can
      // include the email payload Resend echoed back. Security audit F-04.
      console.error("contact_api.resend_error");
      return NextResponse.json<ContactAPIResponse>({ success: false, error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json<ContactAPIResponse>({ success: true });
  } catch {
    // Generic catch — no variable bound, so no PII can leak to logs.
    console.error("contact_api.unhandled_error");
    return NextResponse.json<ContactAPIResponse>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
