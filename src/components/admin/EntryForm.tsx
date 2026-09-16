"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectTypes, sculptureStatuses, type Project, type Sculpture } from "@/lib/content/schemas";
import { ImageUploader } from "./ImageUploader";

type Kind = "projects" | "sculptures";
type Entry = Project | Sculpture;
type Lang = "fr" | "en";

const emptyText = { title: "", summary: "", description: "" };

function blank(kind: Kind): Entry {
  const year = new Date().getFullYear();
  if (kind === "projects") {
    return { slug: "", type: "residential", location: "", year, surface: null, cover: "", hover: null, gallery: [], featured: false, order: 0, fr: { ...emptyText }, en: { ...emptyText } };
  }
  return { slug: "", material: "", dimensions: "", year, status: "available", price: null, images: [], featured: false, order: 0, fr: { ...emptyText }, en: { ...emptyText } };
}

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const input = "w-full border-b border-line bg-transparent py-2 outline-none focus:border-terracotta";
const label = "block text-[0.65rem] uppercase tracking-[0.28em] text-ink-soft";

export function EntryForm({ kind, initial }: { kind: Kind; initial: Entry | null }) {
  const router = useRouter();
  const isNew = initial === null;
  const [entry, setEntry] = useState<Entry>(initial ?? blank(kind));
  const [lang, setLang] = useState<Lang>("fr");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => setEntry((e) => ({ ...e, [key]: value }) as Entry);
  const setText = (field: "title" | "summary" | "description", value: string) =>
    setEntry((e) => ({ ...e, [lang]: { ...e[lang], [field]: value } }) as Entry);

  // Images: projects have cover + gallery; sculptures have images[]. The uploader edits one flat list.
  // For projects the flat list is: cover, then (if "hasHover") the hover view, then the gallery.
  const hasHover = kind === "projects" && (entry as Project).hover !== null;
  const images =
    kind === "projects"
      ? [(entry as Project).cover, ...(hasHover ? [(entry as Project).hover as string] : []), ...(entry as Project).gallery].filter(Boolean)
      : (entry as Sculpture).images;
  const splitProject = (list: string[], withHover: boolean) => ({
    cover: list[0] ?? "",
    hover: withHover ? (list[1] ?? null) : null,
    gallery: list.slice(withHover ? 2 : 1),
  });
  const setImages = (list: string[]) => {
    if (kind === "projects") setEntry((e) => ({ ...(e as Project), ...splitProject(list, hasHover) }));
    else setEntry((e) => ({ ...(e as Sculpture), images: list }));
  };
  const toggleHover = (on: boolean) => setEntry((e) => ({ ...(e as Project), ...splitProject(images, on) }));

  async function save() {
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/admin/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
    const json = (await res.json()) as { ok: boolean; issues?: { fieldErrors?: Record<string, string[]> } };
    if (!json.ok) {
      setStatus("error");
      const fields = json.issues?.fieldErrors ?? {};
      setError(Object.entries(fields).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" · ") || "Contenu invalide");
      return;
    }
    setStatus("saved");
    if (isNew) router.replace(`/admin/${kind}/${entry.slug}`);
    router.refresh();
  }

  const p = entry as Project;
  const s = entry as Sculpture;

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between">
        <h1 className="text-4xl">{isNew ? (kind === "projects" ? "Nouveau projet" : "Nouvelle sculpture") : entry.fr.title || entry.slug}</h1>
        <a href={`/fr/${kind === "projects" ? "projets" : "sculptures"}/${entry.slug}`} target="_blank" className="text-sm underline underline-offset-4">
          Voir la page ↗
        </a>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label>
          <span className={label}>Slug (URL)</span>
          <input
            className={input}
            value={entry.slug}
            disabled={!isNew}
            onChange={(e) => set("slug", slugify(e.target.value))}
            onBlur={() => entry.slug === "" && set("slug", slugify(entry.fr.title))}
            placeholder="ex. casa-arco"
          />
        </label>
        <label>
          <span className={label}>Année</span>
          <input className={input} type="number" value={entry.year} onChange={(e) => set("year", Number(e.target.value))} />
        </label>

        {kind === "projects" ? (
          <>
            <label>
              <span className={label}>Type</span>
              <select className={input} value={p.type} onChange={(e) => set("type" as never, e.target.value as never)}>
                {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              <span className={label}>Lieu</span>
              <input className={input} value={p.location} onChange={(e) => set("location" as never, e.target.value as never)} />
            </label>
            <label>
              <span className={label}>Surface (m², vide si inconnue)</span>
              <input className={input} type="number" value={p.surface ?? ""} onChange={(e) => set("surface" as never, (e.target.value === "" ? null : Number(e.target.value)) as never)} />
            </label>
          </>
        ) : (
          <>
            <label>
              <span className={label}>Statut</span>
              <select className={input} value={s.status} onChange={(e) => set("status" as never, e.target.value as never)}>
                {sculptureStatuses.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              <span className={label}>Matériau</span>
              <input className={input} value={s.material} onChange={(e) => set("material" as never, e.target.value as never)} />
            </label>
            <label>
              <span className={label}>Dimensions</span>
              <input className={input} value={s.dimensions} onChange={(e) => set("dimensions" as never, e.target.value as never)} placeholder="62 × 40 × 18 cm" />
            </label>
            <label>
              <span className={label}>Prix en € (vide = sur demande)</span>
              <input className={input} type="number" value={s.price ?? ""} onChange={(e) => set("price" as never, (e.target.value === "" ? null : Number(e.target.value)) as never)} />
            </label>
          </>
        )}

        <label>
          <span className={label}>Ordre d&apos;affichage (petit = premier)</span>
          <input className={input} type="number" value={entry.order} onChange={(e) => set("order", Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-3 self-end pb-2">
          <input type="checkbox" className="accent-terracotta" checked={entry.featured} onChange={(e) => set("featured", e.target.checked)} />
          <span>Mis en avant sur l&apos;accueil</span>
        </label>
      </div>

      <div className="mt-10">
        <ImageUploader
          kind={kind}
          slug={entry.slug}
          images={images}
          onChange={setImages}
          label={kind === "projects" ? (hasHover ? "Images (1 = couverture, 2 = vue au survol, suite = galerie)" : "Images (1 = couverture, suite = galerie)") : "Images (la première = principale)"}
        />
        {kind === "projects" && (
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" className="accent-terracotta" checked={hasHover} onChange={(e) => toggleHover(e.target.checked)} />
            <span>La 2e image est une vue au survol (ex. la même pièce de nuit)</span>
          </label>
        )}
      </div>

      <div className="mt-10">
        <div className="flex gap-2">
          {(["fr", "en"] as Lang[]).map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] ${lang === l ? "bg-terracotta text-cream" : "border border-line"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6">
          <label>
            <span className={label}>Titre ({lang})</span>
            <input className={input} value={entry[lang].title} onChange={(e) => setText("title", e.target.value)} />
          </label>
          <label>
            <span className={label}>Résumé ({lang}) — une phrase</span>
            <input className={input} value={entry[lang].summary} onChange={(e) => setText("summary", e.target.value)} />
          </label>
          <label>
            <span className={label}>Description ({lang}) — une ligne vide sépare les paragraphes</span>
            <textarea className={`${input} min-h-48`} value={entry[lang].description} onChange={(e) => setText("description", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 mt-12 flex items-center gap-4 border-t border-line bg-cream py-4">
        <button type="button" onClick={save} disabled={status === "saving"} className="rounded-full bg-terracotta px-6 py-3 text-sm text-cream disabled:opacity-60">
          {status === "saving" ? "Enregistrement…" : "Enregistrer"}
        </button>
        {status === "saved" && <span className="text-sm text-ink-soft">Enregistré ✓</span>}
        {error && <span className="text-sm text-menu">{error}</span>}
      </div>
    </div>
  );
}
