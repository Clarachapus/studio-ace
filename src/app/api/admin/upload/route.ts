import { NextResponse, type NextRequest } from "next/server";
import { adminGuard, jsonError } from "@/lib/admin/guard";
import { type MediaKind } from "@/lib/content/store";
import { getAdminStore } from "@/lib/content/admin-store";

export const runtime = "nodejs";

const kinds: MediaKind[] = ["projects", "sculptures", "about", "hero"];

/** multipart/form-data: kind, slug, files[] → { paths: string[] } */
export async function POST(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const slug = String(form.get("slug") ?? "");
  if (!kinds.includes(kind as MediaKind)) return jsonError("invalid kind");
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return jsonError("no files");
  try {
    const store = getAdminStore();
    const paths: string[] = [];
    for (const file of files) {
      paths.push(await store.uploadImage(kind as MediaKind, slug, file, file.name));
    }
    return NextResponse.json({ ok: true, paths });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "upload failed", 500);
  }
}
