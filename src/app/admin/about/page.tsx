import { getAdminStore } from "@/lib/content/admin-store";
import { AboutForm } from "@/components/admin/AboutForm";

export const dynamic = "force-dynamic";

export default async function AdminAbout() {
  return <AboutForm initial={await getAdminStore().getAbout()} />;
}
