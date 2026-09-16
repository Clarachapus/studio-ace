import { type NextRequest } from "next/server";
import { adminGuard } from "@/lib/admin/guard";
import { readAdminMedia } from "@/lib/content/admin-store";

export const runtime = "nodejs";

const types: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
};

/** Editor previews: serves a /media/ file even before the public site is republished. */
export async function GET(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const publicPath = request.nextUrl.searchParams.get("p") ?? "";
  const bytes = await readAdminMedia(publicPath);
  if (!bytes) return new Response(null, { status: 404 });
  const ext = publicPath.split(".").pop()?.toLowerCase() ?? "";
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": types[ext] ?? "application/octet-stream", "Cache-Control": "private, max-age=300" },
  });
}
