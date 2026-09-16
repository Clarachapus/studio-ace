"use client";
/* eslint-disable @next/next/no-img-element -- editor previews come from the private media route */

import { adminPreview } from "@/lib/admin/client-media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { slug: string; title: string; subtitle: string; image: string; featured: boolean; order: number };

export function EntryList({ kind, items }: { kind: "projects" | "sculptures"; items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(slug: string, title: string) {
    if (!confirm(`Supprimer « ${title} » et ses images ? Cette action est définitive.`)) return;
    setBusy(slug);
    await fetch(`/api/admin/${kind}?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (items.length === 0) return <p className="mt-10 text-ink-soft">Aucune entrée. Crée la première.</p>;

  return (
    <ul className="mt-8 divide-y divide-line border-y border-line">
      {items.map((it) => (
        <li key={it.slug} className="flex items-center gap-5 py-4">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-ochre/20">
            <img src={adminPreview(it.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/admin/${kind}/${it.slug}`} className="text-lg hover:text-menu">{it.title}</Link>
            <p className="truncate text-sm text-ink-soft">
              {it.subtitle} · ordre {it.order} {it.featured && "· ★ mis en avant"}
            </p>
          </div>
          <Link href={`/admin/${kind}/${it.slug}`} className="text-sm underline underline-offset-4">Modifier</Link>
          <button type="button" disabled={busy === it.slug} onClick={() => remove(it.slug, it.title)} className="text-sm text-menu hover:underline disabled:opacity-50">
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  );
}
