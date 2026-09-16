import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_DAYS, safeEqual, sessionToken } from "@/lib/admin/auth";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
}

/** Signs in to the online editor. */
export async function POST(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return new NextResponse(null, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (tooManyAttempts(ip)) return NextResponse.json({ ok: false, error: "too_many" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const given = typeof body.password === "string" ? body.password : "";
  const expected = await sessionToken(password);
  if (!given || !safeEqual(await sessionToken(given), expected)) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DAYS * 24 * 3600,
  });
  return res;
}

/** Signs out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
