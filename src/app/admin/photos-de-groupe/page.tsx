import { getAdminStore } from "@/lib/content/admin-store";
import { GroupPhotosForm } from "@/components/admin/GroupPhotosForm";

export const dynamic = "force-dynamic";

export default async function AdminGroupPhotos() {
  const store = getAdminStore();
  const [page, sculptures] = await Promise.all([store.getSculpturePage(), store.listSculptures()]);
  return <GroupPhotosForm initial={page} sculptures={sculptures.map((s) => ({ slug: s.slug, title: s.fr.title }))} />;
}
