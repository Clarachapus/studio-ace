import { getAdminStore } from "@/lib/content/admin-store";
import { ArchitectureForm } from "@/components/admin/ArchitectureForm";

export const dynamic = "force-dynamic";

export default async function AdminArchitecture() {
  return <ArchitectureForm initial={await getAdminStore().getArchitecturePage()} />;
}
