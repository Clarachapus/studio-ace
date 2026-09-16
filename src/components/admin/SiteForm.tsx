"use client";

import { useState } from "react";
import type { Site } from "@/lib/content/schemas";
import { Card, Field, LangTabs, SaveBar, describeIssues, inputCls, putJson, type Lang, type SaveStatus } from "./FormKit";

const withProtocol = (url: string) => {
  const u = url.trim();
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

export function SiteForm({ initial }: { initial: Site }) {
  const [site, setSite] = useState<Site>(initial);
  const [address, setAddress] = useState(initial.address.join("\n"));
  const [lang, setLang] = useState<Lang>("fr");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errors, setErrors] = useState<string[]>([]);

  const touch = () => status === "saved" && setStatus("idle");
  const set = <K extends "name" | "leadsEmail" | "publicEmail" | "phone">(key: K, value: string) => {
    touch();
    setSite((s) => ({ ...s, [key]: value }));
  };
  const setLegal = (key: "companyName" | "siren" | "host", value: string) => {
    touch();
    setSite((s) => ({ ...s, legal: { ...s.legal, [key]: value } }));
  };
  const setLangText = (key: "tagline", value: string) => {
    touch();
    setSite((s) => ({ ...s, [lang]: { ...s[lang], [key]: value } }));
  };
  const setSeo = (key: "title" | "description", value: string) => {
    touch();
    setSite((s) => ({ ...s, [lang]: { ...s[lang], seo: { ...s[lang].seo, [key]: value } } }));
  };
  const setSocial = (i: number, key: "label" | "url", value: string) => {
    touch();
    setSite((s) => ({ ...s, social: s.social.map((l, j) => (j === i ? { ...l, [key]: value } : l)) }));
  };
  const addSocial = () => setSite((s) => ({ ...s, social: [...s.social, { label: "", url: "" }] }));
  const removeSocial = (i: number) => setSite((s) => ({ ...s, social: s.social.filter((_, j) => j !== i) }));

  async function save() {
    setStatus("saving");
    setErrors([]);
    const payload: Site = {
      ...site,
      name: site.name.trim(),
      leadsEmail: site.leadsEmail.trim(),
      publicEmail: site.publicEmail.trim(),
      phone: site.phone.trim(),
      address: address.split("\n").map((l) => l.trim()).filter(Boolean),
      social: site.social.filter((l) => l.label.trim() || l.url.trim()).map((l) => ({ label: l.label.trim(), url: withProtocol(l.url) })),
    };
    const result = await putJson("/api/admin/site", payload);
    if (result.ok) {
      setSite(payload);
      setStatus("saved");
    } else {
      setStatus("error");
      setErrors(describeIssues(result.issues));
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Coordonnées et infos du site</h1>
      <p className="mt-2 text-ink-soft">Email, téléphone et Instagram affichés dans la page À propos, réseaux et mentions légales. Clique sur « Enregistrer » quand c&apos;est prêt.</p>

      <div className="mt-8 grid gap-6">
        <Card title="Coordonnées">
          <Field label="Nom du studio">
            <input className={inputCls} value={site.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email qui reçoit les demandes" help="Les formulaires du site y envoient les messages.">
              <input type="email" className={inputCls} value={site.leadsEmail} onChange={(e) => set("leadsEmail", e.target.value)} />
            </Field>
            <Field label="Email affiché sur le site">
              <input type="email" className={inputCls} value={site.publicEmail} onChange={(e) => set("publicEmail", e.target.value)} />
            </Field>
          </div>
          <Field label="Téléphone">
            <input type="tel" className={inputCls} value={site.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Adresse" help="Une ligne par ligne d'adresse.">
            <textarea
              className={`${inputCls} min-h-28`}
              value={address}
              onChange={(e) => {
                touch();
                setAddress(e.target.value);
              }}
            />
          </Field>
        </Card>

        <Card title="Réseaux" help="Instagram, LinkedIn… Colle simplement le lien.">
          {site.social.map((link, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <Field label="Nom">
                <input className={inputCls} value={link.label} placeholder="Instagram" onChange={(e) => setSocial(i, "label", e.target.value)} />
              </Field>
              <Field label="Lien">
                <input
                  className={inputCls}
                  value={link.url}
                  placeholder="instagram.com/studio_a.c.e"
                  onChange={(e) => setSocial(i, "url", e.target.value)}
                  onBlur={(e) => setSocial(i, "url", withProtocol(e.target.value))}
                />
              </Field>
              <button type="button" onClick={() => removeSocial(i)} className="pb-3 text-sm text-menu hover:underline">
                Retirer
              </button>
            </div>
          ))}
          <button type="button" onClick={addSocial} className="justify-self-start rounded-full border border-line px-4 py-2 text-sm hover:border-terracotta">
            + Ajouter un réseau
          </button>
        </Card>

        <Card title="Mentions légales">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Raison sociale">
              <input className={inputCls} value={site.legal.companyName} onChange={(e) => setLegal("companyName", e.target.value)} />
            </Field>
            <Field label="SIREN">
              <input className={inputCls} value={site.legal.siren} onChange={(e) => setLegal("siren", e.target.value)} />
            </Field>
          </div>
          <Field label="Hébergeur du site">
            <input className={inputCls} value={site.legal.host} onChange={(e) => setLegal("host", e.target.value)} />
          </Field>
        </Card>

        <div className="sticky top-14 z-10 -mx-5 bg-cream/95 px-5 py-3 backdrop-blur">
          <LangTabs lang={lang} onChange={setLang} />
        </div>

        <Card title="Accroche et Google" help="La phrase sous le nom du studio, et ce qui apparaît dans les résultats Google.">
          <Field label={`Phrase d'accroche (${lang.toUpperCase()})`}>
            <input className={inputCls} value={site[lang].tagline} onChange={(e) => setLangText("tagline", e.target.value)} />
          </Field>
          <Field label={`Titre dans Google (${lang.toUpperCase()})`}>
            <input className={inputCls} value={site[lang].seo.title} onChange={(e) => setSeo("title", e.target.value)} />
          </Field>
          <Field label={`Description dans Google (${lang.toUpperCase()})`} help="Une ou deux phrases, 160 caractères environ.">
            <textarea className={`${inputCls} min-h-24`} value={site[lang].seo.description} onChange={(e) => setSeo("description", e.target.value)} />
          </Field>
        </Card>
      </div>

      <SaveBar status={status} errors={errors} onSave={save} />
    </div>
  );
}
