"use client";

import { useState } from "react";
import { adminPreview } from "@/lib/admin/client-media";
import { inputCls } from "./FormKit";

const MAX_BYTES = 4 * 1024 * 1024;

/** Portfolio offered for download: a PDF sent to the site (4 MB max) or a link to another website. */
export function PortfolioField({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState(value && !value.startsWith("/") ? value : "");

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return setError("Choisis un fichier PDF.");
    if (file.size > MAX_BYTES) return setError("Ce PDF dépasse 4 Mo. Compresse-le (par exemple sur ilovepdf.com), ou colle plutôt un lien ci-dessous.");
    setBusy(true);
    const fd = new FormData();
    fd.set("kind", "about");
    fd.set("slug", "portfolio");
    fd.append("files", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; paths?: string[]; error?: string };
      if (!json.ok || !json.paths?.[0]) throw new Error(json.error ?? "Échec de l'envoi");
      setLink("");
      onChange(json.paths[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  }

  const applyLink = (raw: string) => {
    setLink(raw);
    const url = raw.trim();
    if (!url) return onChange(value?.startsWith("/") ? value : null);
    onChange(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  };

  return (
    <div className="grid gap-4">
      {value ? (
        <p className="text-sm">
          Portfolio actuel :{" "}
          <a href={value.startsWith("/") ? adminPreview(value) : value} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            {value.split("/").pop()}
          </a>{" "}
          <button type="button" onClick={() => { setLink(""); onChange(null); }} className="ml-2 text-menu hover:underline">
            Retirer
          </button>
        </p>
      ) : (
        <p className="text-sm text-ink-soft">Pas de portfolio : le lien « Télécharger le portfolio » est caché sur le site.</p>
      )}
      <label className="cursor-pointer justify-self-start rounded-full border border-line px-5 py-2.5 text-sm hover:border-terracotta">
        {busy ? "Envoi du PDF…" : "Envoyer un PDF (4 Mo maximum)"}
        <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      <label className="block">
        <span className="block text-[0.72rem] uppercase tracking-[0.18em] text-ink-soft">Ou un lien (Google Drive, Dropbox…)</span>
        <input value={link} onChange={(e) => applyLink(e.target.value)} placeholder="https://…" className={inputCls} />
      </label>
      {error && <p className="text-sm text-menu" role="alert">{error}</p>}
    </div>
  );
}
