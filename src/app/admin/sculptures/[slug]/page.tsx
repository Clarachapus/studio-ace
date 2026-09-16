import { getAdminStore } from "@/lib/content/admin-store";
import { EntryForm } from "@/components/admin/EntryForm";

export const dynamic = "force-dynamic";

export default async function EditSculpture({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sculpture = slug === "new" ? null : await getAdminStore().getSculpture(slug);
  return <EntryForm kind="sculptures" initial={sculpture} />;
}
