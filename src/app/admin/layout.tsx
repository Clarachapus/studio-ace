import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminEnabled, hasAdminSession } from "@/lib/admin/guard";
import { onlineStorage } from "@/lib/content/admin-store";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata = { title: "Éditeur · studio a.c.e", robots: { index: false } };

const nav = [
  { href: "/admin", label: "Accueil" },
  { href: "/admin/projects", label: "Projets" },
  { href: "/admin/sculptures", label: "Sculptures" },
  { href: "/admin/about", label: "À propos" },
  { href: "/admin/site", label: "Coordonnées & infos" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!adminEnabled) notFound();
  if (!(await hasAdminSession())) redirect("/admin-login");
  const online = onlineStorage();
  return (
    <div className="theme-light-scope min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 h-14 text-sm">
          <span className="font-display tracking-[0.02em]">studio a.c.e · éditeur</span>
          <nav className="flex gap-4">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-menu">
                {n.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden rounded-full bg-ochre/15 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] md:inline">
            {online ? "En ligne · visible sur le site 1 à 2 min après l'enregistrement" : "Local uniquement"}
          </span>
          {online && <LogoutButton />}
          <a href="/fr" target="_blank" className="text-xs underline underline-offset-4">Voir le site ↗</a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
