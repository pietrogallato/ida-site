import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

const secret = process.env.SANITY_REVALIDATION_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER_NAME);

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { slug?: { current?: string } } = {};
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Revalidate blog list pages
  revalidatePath("/it/blog");
  revalidatePath("/en/blog");

  // Revalidate specific post if slug is present
  if (payload?.slug?.current) {
    revalidatePath(`/it/blog/${payload.slug.current}`);
    revalidatePath(`/en/blog/${payload.slug.current}`);
  }

  // Revalidate sitemap
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true });
}
