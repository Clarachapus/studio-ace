"use client";
/* eslint-disable @next/next/no-img-element -- editor previews come from the private media route */

import { useRef, useState, type PointerEvent } from "react";
import type { GroupZone, SculpturePage } from "@/lib/content/schemas";
import { adminPreview, shrinkForUpload } from "@/lib/admin/client-media";
import { Card, SaveBar, describeIssues, inputCls, putJson, type SaveStatus } from "./FormKit";

type Option = { slug: string; title: string };
type Draft = { x: number; y: number; w: number; h: number };

const clamp = (v: number) => Math.min(100, Math.max(0, v));
const round = (v: number) => Math.round(v * 10) / 10;

/**
 * Group photos of the Sculpture page: on each photo, draw a frame around a sculpture
 * and choose which one it is. Visitors click the frame to open that sculpture.
 */
export function GroupPhotosForm({ initial, sculptures }: { initial: SculpturePage; sculptures: Option[] }) {
  const [groups, setGroups] = useState(initial.groups);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const change = (next: SculpturePage["groups"]) => {
    if (status === "saved") setStatus("idle");
    setGroups(next);
  };
  const setZones = (gi: number, zones: GroupZone[]) => change(groups.map((g, i) => (i === gi ? { ...g, zones } : g)));

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setErrors([]);
    const fd = new FormData();
    fd.set("kind", "sculptures");
    fd.set("slug", "groupes");
    fd.append("files", await shrinkForUpload(file));
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; paths?: string[]; error?: string };
      if (!json.ok || !json.paths?.[0]) throw new Error(json.error ?? "Échec de l'envoi");
      change([...groups, { image: json.paths[0], zones: [] }]);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Échec de l'envoi"]);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setStatus("saving");
    setErrors([]);
    const result = await putJson("/api/admin/sculpture-page", { groups });
    if (result.ok) setStatus("saved");
    else {
      setStatus("error");
      setErrors(describeIssues(result.issues));
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl">Photos de groupe</h1>
      <p className="mt-2 text-ink-soft">
        Une photo qui montre plusieurs sculptures. Elle s&apos;affiche au milieu des autres sur la page Sculpture. Sur chaque photo, trace un cadre
        autour d&apos;une sculpture avec la souris, puis choisis laquelle c&apos;est : un clic sur ce cadre ouvrira sa fiche.
      </p>

      <div className="mt-8 grid gap-6">
        {groups.map((g, gi) => (
          <Card key={g.image} title={`Photo ${gi + 1}`} help={g.zones.length === 0 ? "Aucun cadre pour l'instant : trace-en un sur la photo." : undefined}>
            <ZoneEditor src={g.image} zones={g.zones} sculptures={sculptures} onChange={(z) => setZones(gi, z)} />
            <button
              type="button"
              onClick={() => confirm("Retirer cette photo de groupe ?") && change(groups.filter((_, i) => i !== gi))}
              className="justify-self-start text-sm text-menu hover:underline"
            >
              Retirer cette photo
            </button>
          </Card>
        ))}

        <label className="cursor-pointer justify-self-start rounded-full border border-line px-5 py-3 text-sm hover:border-terracotta">
          {uploading ? "Envoi de la photo…" : "+ Ajouter une photo de groupe"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => addPhoto(e.target.files?.[0])} />
        </label>
      </div>
      <SaveBar status={status} errors={errors} onSave={save} />
    </div>
  );
}

function ZoneEditor({ src, zones, sculptures, onChange }: { src: string; zones: GroupZone[]; sculptures: Option[]; onChange: (zones: GroupZone[]) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const title = (slug: string) => sculptures.find((s) => s.slug === slug)?.title ?? slug;

  const point = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-zone]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = point(e);
    setDraft({ ...start.current, w: 0, h: 0 });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const p = point(e);
    const s = start.current;
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const up = () => {
    const d = draft;
    start.current = null;
    setDraft(null);
    if (!d || d.w < 2 || d.h < 2 || sculptures.length === 0) return;
    onChange([...zones, { slug: sculptures[0].slug, x: round(d.x), y: round(d.y), w: round(d.w), h: round(d.h) }]);
  };

  return (
    <div className="grid gap-4">
      <div
        ref={box}
        className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-md bg-black/5"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <img src={adminPreview(src)} alt="" className="block w-full" draggable={false} />
        {zones.map((z, i) => (
          <div
            key={i}
            data-zone
            className="absolute border-2 border-terracotta bg-terracotta/15"
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
          >
            <span className="absolute left-0 top-0 bg-terracotta px-1.5 py-0.5 text-xs text-cream">
              {i + 1}. {title(z.slug)}
            </span>
          </div>
        ))}
        {draft && <div className="absolute border-2 border-dashed border-terracotta" style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.w}%`, height: `${draft.h}%` }} />}
      </div>
      {zones.length > 0 && (
        <ol className="grid gap-3">
          {zones.map((z, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3">
              <span className="w-6 text-sm text-ink-soft">{i + 1}.</span>
              <select
                value={z.slug}
                onChange={(e) => onChange(zones.map((zz, j) => (j === i ? { ...zz, slug: e.target.value } : zz)))}
                className={`${inputCls} mt-0 w-auto min-w-56`}
                aria-label={`Sculpture du cadre ${i + 1}`}
              >
                {sculptures.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => onChange(zones.filter((_, j) => j !== i))} className="text-sm text-menu hover:underline">
                Retirer le cadre
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
