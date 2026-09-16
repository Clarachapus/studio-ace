"use client";

import { useRouter } from "next/navigation";

/** Ends the online editor session. */
export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin-login", { method: "DELETE" }).catch(() => null);
    router.replace("/admin-login");
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} className="text-xs underline underline-offset-4">
      Se déconnecter
    </button>
  );
}
