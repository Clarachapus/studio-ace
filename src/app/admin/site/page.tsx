import { getAdminStore } from "@/lib/content/admin-store";
import { SiteForm } from "@/components/admin/SiteForm";

export const dynamic = "force-dynamic";

export default async function AdminSite() {
  return <SiteForm initial={await getAdminStore().getSite()} />;
}
