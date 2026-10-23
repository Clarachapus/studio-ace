import { NextResponse, type NextRequest } from "next/server";
import { adminGuard } from "@/lib/admin/guard";
import { getAdminStore } from "@/lib/content/admin-store";
import { sculpturePageSchema } from "@/lib/content/schemas";

export const runtime = "nodejs";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json(await getAdminStore().getSculpturePage());
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = sculpturePageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  await getAdminStore().saveSculpturePage(parsed.data);
  return NextResponse.json({ ok: true });
}
