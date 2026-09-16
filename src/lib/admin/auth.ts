/**
 * Password protection of the online editor. Web Crypto only, so it runs both in
 * proxy.ts and in route handlers. The cookie holds an HMAC of the password, never the password.
 */
export const ADMIN_COOKIE = "ace_admin";
export const ADMIN_SESSION_DAYS = 30;

export async function sessionToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode("studio-ace-editor-session-v1"));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Local development needs no password; online, the session cookie must match ADMIN_PASSWORD. */
export async function isAdminSession(cookieValue: string | undefined): Promise<boolean> {
  if (process.env.NODE_ENV === "development") return true;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !cookieValue) return false;
  return safeEqual(cookieValue, await sessionToken(password));
}
