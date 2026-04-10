import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { env } from "@/lib/env";

const secret = env.SANITY_REVALIDATION_SECRET;

// Allow-list of Sanity document types that may drive revalidation.
// Security audit F-11: an explicit switch avoids the previous behaviour
// where any unknown _type fell through into the "blog" branch.
type HandledType = "testimonial" | "post" | "topic" | "resource";
const HANDLED_TYPES = new Set<HandledType>([
  "testimonial",
  "post",
  "topic",
  "resource",
]);

// Slugs from Sanity that reach revalidatePath must look like a single
// URL path segment — no slashes, no dots, no nulls, no whitespace. This
// prevents a malicious payload from normalizing into an unexpected path.
// Security audit F-12.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/i;

export async function POST(req: NextRequest) {
  if (!secret) {
    console.error("revalidate.missing_secret");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER_NAME);

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    // Structured, PII-free log so abuse attempts on the webhook show up
    // in Vercel log drains. Security audit F-39.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    console.warn("revalidate.invalid_signature", { ip });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { _type?: string; slug?: { current?: string } } = {};
  try {
    payload = JSON.parse(body);
  } catch {
    console.warn("revalidate.invalid_payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const type = payload._type;
  if (typeof type !== "string" || !HANDLED_TYPES.has(type as HandledType)) {
    // Unknown types are acknowledged (so Sanity won't retry indefinitely)
    // but we log them for visibility.
    console.info("revalidate.skipped_type", { type: type ?? "undefined" });
    return NextResponse.json({ revalidated: false, reason: "unhandled_type" });
  }

  const handledType = type as HandledType;

  if (handledType === "testimonial") {
    revalidatePath("/it");
    revalidatePath("/en");
    revalidatePath("/it/recensioni");
    revalidatePath("/en/reviews");
  } else if (handledType === "post") {
    revalidatePath("/it/blog");
    revalidatePath("/en/blog");

    const rawSlug = payload?.slug?.current;
    if (typeof rawSlug === "string" && SLUG_RE.test(rawSlug)) {
      revalidatePath(`/it/blog/${rawSlug}`);
      revalidatePath(`/en/blog/${rawSlug}`);
    } else if (rawSlug) {
      console.warn("revalidate.invalid_slug");
    }
  } else if (handledType === "topic" || handledType === "resource") {
    // Topic and resource changes affect blog listing / filters.
    revalidatePath("/it/blog");
    revalidatePath("/en/blog");
  }

  // Revalidate sitemap
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true, type: handledType });
}
