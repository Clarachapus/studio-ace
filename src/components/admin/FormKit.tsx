"use client";

import type { ReactNode } from "react";

export type Lang = "fr" | "en";
export type Issue = { path: string; message: string };
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const inputCls =
  "mt-1 w-full rounded-md border border-line bg-cream px-3 py-2.5 text-base outline-none transition-colors focus:border-terracotta";

export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[0.72rem] uppercase tracking-[0.18em] text-ink-soft">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-ink-soft">{help}</span>}
    </label>
  );
}

export function Card({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-sand p-5 sm:p-6">
      <h2 className="text-2xl">{title}</h2>
      {help && <p className="mt-1 text-sm text-ink-soft">{help}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

export function LangTabs({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  const tab = (value: Lang, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-full px-4 py-2 text-sm transition-colors ${lang === value ? "bg-terracotta text-cream" : "border border-line hover:border-terracotta"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      {tab("fr", "Français")}
      {tab("en", "English")}
      <span className="ml-2 text-xs text-ink-soft">Les textes s&apos;écrivent pour chaque langue.</span>
    </div>
  );
}

export function SaveBar({ status, errors, onSave }: { status: SaveStatus; errors: string[]; onSave: () => void }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-10 border-t border-line bg-cream/95 px-5 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={onSave} disabled={status === "saving"} className="rounded-full bg-terracotta px-7 py-3 text-sm text-cream disabled:opacity-60">
          {status === "saving" ? "Enregistrement…" : "Enregistrer"}
        </button>
        {status === "saved" && <span className="text-sm text-ink-soft">Enregistré ✓ Les changements sont visibles sur le site.</span>}
      </div>
      {errors.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-menu" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const LABELS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^images\.portrait$/, () => "Photo portrait"],
  [/^images\.workshop$/, () => "Photo de l'atelier"],
  [/^(fr|en)\.title$/, (m) => `Titre (${m[1].toUpperCase()})`],
  [/^(fr|en)\.intro$/, (m) => `Introduction (${m[1].toUpperCase()})`],
  [/^(fr|en)\.team\.(\d+)\.(\w+)$/, (m) => `Équipe, personne ${Number(m[2]) + 1} (${m[1].toUpperCase()})`],
  [/^(fr|en)\.seo\.title$/, (m) => `Titre Google (${m[1].toUpperCase()})`],
  [/^(fr|en)\.seo\.description$/, (m) => `Description Google (${m[1].toUpperCase()})`],
  [/^name$/, () => "Nom du studio"],
  [/^leadsEmail$/, () => "Email de réception des demandes"],
  [/^publicEmail$/, () => "Email affiché sur le site"],
  [/^social\.(\d+)\.url$/, (m) => `Lien réseau ${Number(m[1]) + 1}`],
  [/^social\.(\d+)\.label$/, (m) => `Nom du réseau ${Number(m[1]) + 1}`],
];

function frenchMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email")) return "adresse email invalide";
  if (m.includes("url")) return "lien invalide (il doit commencer par https://)";
  if (m.includes("too small") || m.includes(">=1")) return "ne peut pas être vide";
  if (m.includes("/media/")) return "photo manquante";
  return "valeur à vérifier";
}

/** Turns validation issues into short sentences a non-developer can act on. */
export function describeIssues(issues: Issue[]): string[] {
  return [
    ...new Set(
      issues.map((issue) => {
        const hit = LABELS.find(([re]) => re.test(issue.path));
        const label = hit ? hit[1](issue.path.match(hit[0])!) : issue.path;
        return `${label} : ${frenchMessage(issue.message)}`;
      }),
    ),
  ];
}

export async function putJson(endpoint: string, data: unknown): Promise<{ ok: true } | { ok: false; issues: Issue[] }> {
  try {
    const res = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = (await res.json()) as { ok: boolean; issues?: Issue[] };
    return json.ok ? { ok: true } : { ok: false, issues: json.issues ?? [{ path: "", message: "Enregistrement refusé" }] };
  } catch {
    return { ok: false, issues: [{ path: "", message: "Le serveur ne répond pas" }] };
  }
}

/** One paragraph per block of text separated by an empty line. */
export const toParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
