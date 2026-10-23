import Link from "next/link";
import { getAdminStore } from "@/lib/content/admin-store";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [projects, sculptures] = await Promise.all([getAdminStore().listProjects(), getAdminStore().listSculptures()]);
  return (
    <div>
      <h1 className="text-4xl">Éditeur du site</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Choisis ce que tu veux modifier. Chaque « Enregistrer » met le site à jour : les changements sont visibles 2 à 3 minutes plus tard.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card href="/admin/sculptures" title="Sculptures" count={sculptures.length} />
        <Card href="/admin/photos-de-groupe" title="Photos de groupe (page Sculpture)" />
        <Card href="/admin/architecture" title="Page Architecture (images qui défilent)" />
        <Card href="/admin/projects" title="Projets d'architecture (fiches, pour plus tard)" count={projects.length} />
        <Card href="/admin/about" title="À propos" />
        <Card href="/admin/site" title="Coordonnées et infos du site" />
      </div>
    </div>
  );
}

function Card({ href, title, count }: { href: string; title: string; count?: number }) {
  return (
    <Link href={href} className="block border border-line bg-sand p-6 hover:border-terracotta">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">{title}</h2>
        {count !== undefined && <span className="text-ink-soft">{count}</span>}
      </div>
    </Link>
  );
}
