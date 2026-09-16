"use client";
/* eslint-disable @next/next/no-img-element -- editor previews come from the private media route */

import { adminPreview, shrinkForUpload } from "@/lib/admin/client-media";
import { useRef, useState, type DragEvent } from "react";

type Props = {
  label: string;
  help?: string;
  value: string;
  onChange: (path: string) => void;
  /** Preview frame, e.g. "aspect-[4/5]". */
  aspect?: string;
  /** Show the preview with the site's arch mask. */
  arch?: boolean;
};

/** One photo: preview, drag-and-drop or file picker. The file is converted to WebP on upload. */
export function SingleImageField({ label, help, value, onChange, aspect = "aspect-[4/5]", arch = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Ce fichier n'est pas une image.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("kind", "about");
    fd.set("slug", "about");
    fd.append("files", await shrinkForUpload(file));
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; paths?: string[]; error?: string };
      if (!json.ok || !json.paths?.[0]) throw new Error(json.error ?? "Échec de l'envoi");
      onChange(json.paths[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    void upload(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <span className="block text-[0.72rem] uppercase tracking-[0.18em] text-ink-soft">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`mt-2 grid items-center gap-5 rounded-lg border border-dashed p-4 transition-colors sm:grid-cols-[160px_1fr] ${over ? "border-terracotta bg-ochre/10" : "border-line"}`}
      >
        <div className={`relative w-full max-w-[160px] ${aspect} overflow-hidden bg-ochre/20 ${arch ? "arch" : "rounded-md"}`}>
          {value && <img src={adminPreview(value)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="text-sm">
          <p>{busy ? "Envoi de la photo…" : "Glisse une photo ici, ou"}</p>
          {!busy && (
            <button type="button" onClick={() => input.current?.click()} className="mt-2 rounded-full border border-terracotta px-4 py-2 text-menu hover:bg-terracotta hover:text-cream">
              Choisir une photo
            </button>
          )}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <p className="mt-2 text-xs text-ink-soft">JPG, PNG ou WebP. Redimensionnée et optimisée automatiquement.</p>
          {help && <p className="mt-1 text-xs text-ink-soft">{help}</p>}
          {error && <p className="mt-2 text-menu">{error}</p>}
        </div>
      </div>
    </div>
  );
}
