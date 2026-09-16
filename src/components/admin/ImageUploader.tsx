"use client";
/* eslint-disable @next/next/no-img-element -- editor previews come from the private media route */

import { adminPreview, shrinkForUpload } from "@/lib/admin/client-media";
import { useState, type DragEvent } from "react";
import type { MediaKind } from "@/lib/content/store";

type Props = {
  kind: MediaKind;
  slug: string;
  images: string[];
  onChange: (images: string[]) => void;
  label: string;
};

/** Drag-and-drop uploader with reorder and remove. Uploads go to /api/admin/upload. */
export function ImageUploader({ kind, slug, images, onChange, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

  async function upload(files: FileList | File[]) {
    if (!ready) {
      setError("Renseigne d'abord un slug valide (minuscules, chiffres, tirets).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // One photo per request: stays under the host's upload size limit.
      const added: string[] = [];
      for (const original of Array.from(files)) {
        const fd = new FormData();
        fd.set("kind", kind);
        fd.set("slug", slug);
        fd.append("files", await shrinkForUpload(original));
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; paths?: string[]; error?: string };
        if (!json.ok || !json.paths) throw new Error(json.error ?? "Échec de l'envoi");
        added.push(...json.paths);
        onChange([...images, ...added]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="block text-[0.65rem] uppercase tracking-[0.28em] text-ink-soft">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`mt-2 border border-dashed p-4 text-center text-sm ${ready ? "border-line" : "border-terracotta/50 opacity-70"}`}
      >
        {busy ? "Traitement des images…" : "Glisse des images ici, ou "}
        {!busy && (
          <label className="cursor-pointer underline underline-offset-4">
            choisis des fichiers
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
          </label>
        )}
        <p className="mt-1 text-xs text-ink-soft">Converties en WebP, 2400 px max, rangées dans public/media/{kind}/{slug || "…"}/</p>
      </div>
      {error && <p className="mt-2 text-sm text-menu">{error}</p>}
      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src} className="group relative">
              <div className="relative aspect-square overflow-hidden bg-ochre/20">
                <img src={adminPreview(src)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <button type="button" onClick={() => move(i, -1)} className="px-1 hover:text-menu" aria-label="Monter">←</button>
                <span className="text-ink-soft">{i === 0 ? "principale" : i + 1}</span>
                <button type="button" onClick={() => move(i, 1)} className="px-1 hover:text-menu" aria-label="Descendre">→</button>
              </div>
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-xs text-cream opacity-0 group-hover:opacity-100">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
