import { NextResponse, type NextRequest } from "next/server";
import { adminGuard } from "@/lib/admin/guard";
import { getAdminStore } from "@/lib/content/admin-store";
import { architecturePageSchema } from "@/lib/content/schemas";

export const runtime = "nodejs";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json(await getAdminStore().getArchitecturePage());
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = architecturePageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  await getAdminStore().saveArchitecturePage(parsed.data);
  return NextResponse.json({ ok: true });
}
