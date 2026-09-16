import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE, isAdminSession } from "./lib/admin/auth";

const intl = createMiddleware(routing);

/**
 * The /admin editor and its API: free in local development. Online they answer 404
 * unless ADMIN_PASSWORD is set, and then require the session from /admin-login.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin-login" || pathname === "/api/admin-login";
  const isAdmin = !isLogin && (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"));

  if (isLogin) {
    return process.env.NODE_ENV === "development" || process.env.ADMIN_PASSWORD
      ? NextResponse.next()
      : new NextResponse(null, { status: 404 });
  }

  if (isAdmin) {
    if (process.env.NODE_ENV !== "development") {
      if (!process.env.ADMIN_PASSWORD) return new NextResponse(null, { status: 404 });
      if (!(await isAdminSession(request.cookies.get(ADMIN_COOKIE)?.value))) {
        return pathname.startsWith("/api/")
          ? NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
          : NextResponse.redirect(new URL("/admin-login", request.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  matcher: ["/((?!_next|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
