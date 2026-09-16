import Link from "next/link";
import { getAdminStore } from "@/lib/content/admin-store";
import { EntryList } from "@/components/admin/EntryList";

export const dynamic = "force-dynamic";

export default async function AdminSculptures() {
  const sculptures = await getAdminStore().listSculptures();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">Sculptures</h1>
        <Link href="/admin/sculptures/new" className="rounded-full bg-terracotta px-5 py-2 text-sm text-cream">+ Nouvelle sculpture</Link>
      </div>
      <EntryList
        kind="sculptures"
        items={sculptures.map((s) => ({ slug: s.slug, title: s.fr.title, subtitle: `${s.status} · ${s.material} · ${s.year}`, image: s.images[0], featured: s.featured, order: s.order }))}
      />
    </div>
  );
}
