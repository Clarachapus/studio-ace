import { getAdminStore } from "@/lib/content/admin-store";
import { EntryForm } from "@/components/admin/EntryForm";

export const dynamic = "force-dynamic";

export default async function EditProject({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = slug === "new" ? null : await getAdminStore().getProject(slug);
  return <EntryForm kind="projects" initial={project} />;
}
