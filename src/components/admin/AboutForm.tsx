"use client";

import { useState } from "react";
import type { About, AboutEntry } from "@/lib/content/schemas";
import { Card, Field, LangTabs, SaveBar, describeIssues, inputCls, putJson, toParagraphs, type Lang, type SaveStatus } from "./FormKit";
import { SingleImageField } from "./SingleImageField";

type ListKey = "projects" | "exhibitions";
const emptyEntry: AboutEntry = { title: "", details: "", place: "", year: "" };

/** Both languages list the same items; keep the two lists the same length. */
function align(about: About): About {
  const next = { ...about, fr: { ...about.fr }, en: { ...about.en } };
  for (const key of ["projects", "exhibitions"] as const) {
    const n = Math.max(about.fr[key].length, about.en[key].length);
    next.fr[key] = Array.from({ length: n }, (_, i) => about.fr[key][i] ?? { ...about.en[key][i] });
    next.en[key] = Array.from({ length: n }, (_, i) => about.en[key][i] ?? { ...about.fr[key][i] });
  }
  return next;
}

export function AboutForm({ initial }: { initial: About }) {
  const [about, setAbout] = useState<About>(() => align(initial));
  const [story, setStory] = useState<Record<Lang, string>>({ fr: initial.fr.story.join("\n\n"), en: initial.en.story.join("\n\n") });
  const [lang, setLang] = useState<Lang>("fr");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const text = about[lang];

  const touch = () => status === "saved" && setStatus("idle");
  const setField = (key: "title" | "subtitle" | "intro", value: string) => {
    touch();
    setAbout((a) => ({ ...a, [lang]: { ...a[lang], [key]: value } }));
  };
  const setEntry = (list: ListKey, i: number, key: keyof AboutEntry, value: string) => {
    touch();
    setAbout((a) => ({ ...a, [lang]: { ...a[lang], [list]: a[lang][list].map((e, j) => (j === i ? { ...e, [key]: value } : e)) } }));
  };
  const addEntry = (list: ListKey) =>
    setAbout((a) => ({ ...a, fr: { ...a.fr, [list]: [...a.fr[list], { ...emptyEntry }] }, en: { ...a.en, [list]: [...a.en[list], { ...emptyEntry }] } }));
  const removeEntry = (list: ListKey, i: number) => {
    if (!confirm(`Retirer « ${about[lang][list][i]?.title || "cette ligne"} » ?`)) return;
    setAbout((a) => ({ ...a, fr: { ...a.fr, [list]: a.fr[list].filter((_, j) => j !== i) }, en: { ...a.en, [list]: a.en[list].filter((_, j) => j !== i) } }));
  };

  async function save() {
    setStatus("saving");
    setErrors([]);
    const keep = (list: ListKey) => (_: AboutEntry, i: number) => [about.fr[list][i], about.en[list][i]].some((e) => e && (e.title || e.details || e.place || e.year));
    const payload: About = {
      ...about,
      fr: { ...about.fr, story: toParagraphs(story.fr), projects: about.fr.projects.filter(keep("projects")), exhibitions: about.fr.exhibitions.filter(keep("exhibitions")) },
      en: { ...about.en, story: toParagraphs(story.en), projects: about.en.projects.filter(keep("projects")), exhibitions: about.en.exhibitions.filter(keep("exhibitions")) },
    };
    const result = await putJson("/api/admin/about", payload);
    if (result.ok) setStatus("saved");
    else {
      setStatus("error");
      setErrors(describeIssues(result.issues));
    }
  }

  const listCard = (list: ListKey, title: string, help: string, placeholders: AboutEntry) => (
    <Card title={title} help={help}>
      {text[list].map((entry, i) => (
        <div key={i} className="grid gap-4 rounded-lg border border-line bg-cream p-4 sm:grid-cols-[2fr_2fr_1.2fr_0.8fr]">
          <Field label="Nom">
            <input className={inputCls} value={entry.title} placeholder={placeholders.title} onChange={(e) => setEntry(list, i, "title", e.target.value)} />
          </Field>
          <Field label={`Détail (${lang.toUpperCase()})`}>
            <input className={inputCls} value={entry.details} placeholder={placeholders.details} onChange={(e) => setEntry(list, i, "details", e.target.value)} />
          </Field>
          <Field label={`Lieu (${lang.toUpperCase()})`}>
            <input className={inputCls} value={entry.place} placeholder={placeholders.place} onChange={(e) => setEntry(list, i, "place", e.target.value)} />
          </Field>
          <Field label="Année">
            <input className={inputCls} value={entry.year} placeholder={placeholders.year} inputMode="numeric" onChange={(e) => setEntry(list, i, "year", e.target.value)} />
          </Field>
          <button type="button" onClick={() => removeEntry(list, i)} className="justify-self-start text-sm text-menu hover:underline sm:col-span-4">
            Retirer cette ligne
          </button>
        </div>
      ))}
      <button type="button" onClick={() => addEntry(list)} className="justify-self-start rounded-full border border-line px-4 py-2 text-sm hover:border-terracotta">
        + Ajouter une ligne
      </button>
    </Card>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Page À propos</h1>
      <p className="mt-2 text-ink-soft">Modifie la photo, les textes et les listes, puis clique sur « Enregistrer ».</p>

      <div className="mt-8 grid gap-6">
        <Card title="Portrait" help="Commun aux deux langues. Affiché en arche : garde le visage dans le haut de la photo.">
          <SingleImageField label="Photo" value={about.images.portrait} onChange={(p) => { touch(); setAbout((a) => ({ ...a, images: { ...a.images, portrait: p } })); }} arch />
        </Card>

        <div className="sticky top-14 z-10 -mx-5 bg-cream/95 px-5 py-3 backdrop-blur">
          <LangTabs lang={lang} onChange={setLang} />
        </div>

        <Card title="Présentation">
          <Field label="Nom affiché en titre">
            <input className={inputCls} value={text.title} onChange={(e) => setField("title", e.target.value)} />
          </Field>
          <Field label="Sous-titre" help="Une ligne sous le nom, par exemple le métier et les villes.">
            <input className={inputCls} value={text.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
          </Field>
          <Field label="Première phrase" help="Affichée en plus grand, en tête de la biographie.">
            <textarea className={`${inputCls} min-h-24`} value={text.intro} onChange={(e) => setField("intro", e.target.value)} />
          </Field>
          <Field label="Biographie" help="Laisse une ligne vide entre deux paragraphes.">
            <textarea
              className={`${inputCls} min-h-72`}
              value={story[lang]}
              onChange={(e) => {
                touch();
                setStory((s) => ({ ...s, [lang]: e.target.value }));
              }}
            />
          </Field>
        </Card>

        {listCard("projects", "Projets", "Les projets d'architecture listés sur la page.", { title: "Appartement Goncourt", details: "40 m², livré", place: "Paris", year: "2025" })}
        {listCard("exhibitions", "Expositions", "Les expositions listées sur la page.", { title: "Mujeres Creadoras", details: "Exposition collective", place: "Mexico", year: "2023" })}
      </div>

      <SaveBar status={status} errors={errors} onSave={save} />
    </div>
  );
}
