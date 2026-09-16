import { NextResponse, type NextRequest } from "next/server";
import { leadSchema } from "@/lib/leads/schema";
import { deliverLead, verifyTurnstile } from "@/lib/leads/deliver";
import { isRateLimited } from "@/lib/leads/rate-limit";
import { getSite } from "@/lib/content";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (isRateLimited(ip ?? "anonymous")) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const lead = parsed.data;

  // Published without an email service (Resend): the visitor's own mail app sends the request.
  const deliveryConfigured = Boolean(process.env.RESEND_API_KEY && process.env.LEADS_FROM_EMAIL);
  if (!deliveryConfigured && process.env.NODE_ENV !== "development") {
    const site = await getSite();
    return NextResponse.json({ ok: false, fallback: "mailto", to: site.leadsEmail });
  }

  if (!(await verifyTurnstile(lead.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "captcha" }, { status: 400 });
  }

  try {
    const site = await getSite();
    await deliverLead(lead, { leadsEmail: site.leadsEmail, siteName: site.name });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[leads] delivery failed", err);
    return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
  }
}
