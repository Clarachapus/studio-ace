import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminSession } from "./auth";

/** The editor exists locally, or online once ADMIN_PASSWORD is set on the host. */
export const adminEnabled = process.env.NODE_ENV === "development" || Boolean(process.env.ADMIN_PASSWORD);

export async function hasAdminSession(): Promise<boolean> {
  return isAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Second line of defence after proxy.ts: API handlers refuse without the editor session. */
export async function adminGuard(): Promise<NextResponse | null> {
  if (!adminEnabled) return new NextResponse(null, { status: 404 });
  return (await hasAdminSession()) ? null : NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}
