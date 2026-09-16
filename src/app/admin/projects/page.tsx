import Link from "next/link";
import { getAdminStore } from "@/lib/content/admin-store";
import { EntryList } from "@/components/admin/EntryList";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const projects = await getAdminStore().listProjects();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">Projets</h1>
        <Link href="/admin/projects/new" className="rounded-full bg-terracotta px-5 py-2 text-sm text-cream">+ Nouveau projet</Link>
      </div>
      <EntryList
        kind="projects"
        items={projects.map((p) => ({ slug: p.slug, title: p.fr.title, subtitle: `${p.type} · ${p.location} · ${p.year}`, image: p.cover, featured: p.featured, order: p.order }))}
      />
    </div>
  );
}
