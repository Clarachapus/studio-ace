import { NextResponse, type NextRequest } from "next/server";
import { adminGuard, jsonError } from "@/lib/admin/guard";
import { getAdminStore } from "@/lib/content/admin-store";
import { sculptureSchema } from "@/lib/content/schemas";

export const runtime = "nodejs";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json(await getAdminStore().listSculptures());
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = sculptureSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, issues: parsed.error.flatten() }, { status: 400 });
  await getAdminStore().saveSculpture(parsed.data);
  return NextResponse.json({ ok: true, slug: parsed.data.slug });
}

export async function DELETE(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return jsonError("slug required");
  await getAdminStore().deleteSculpture(slug);
  return NextResponse.json({ ok: true });
}
