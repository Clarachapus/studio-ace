import Link from "next/link";
import { getAdminStore } from "@/lib/content/admin-store";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [projects, sculptures] = await Promise.all([getAdminStore().listProjects(), getAdminStore().listSculptures()]);
  return (
    <div>
      <h1 className="text-4xl">Éditeur du site</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Cette page n&apos;existe qu&apos;en local. Modifie les projets, les sculptures, la page À propos et les infos du site ;
        les changements sont écrits dans <code>content/</code> et <code>public/media/</code>. Une fois satisfait,
        demande la mise en ligne.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card href="/admin/projects" title="Projets" count={projects.length} />
        <Card href="/admin/sculptures" title="Sculptures" count={sculptures.length} />
        <Card href="/admin/about" title="À propos" />
        <Card href="/admin/site" title="Coordonnées et infos du site" />
      </div>
      <p className="mt-10 text-sm text-ink-soft">
        Images du héros : modifie <code>content/hero.json</code> et dépose tes images dans <code>public/media/hero/</code>.
      </p>
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
