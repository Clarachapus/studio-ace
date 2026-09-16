"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { budgetOptions, projectTypeOptions } from "@/lib/leads/schema";

type Props = { kind: "project" | "sculpture"; locale: "fr" | "en"; piece?: string };
type Status = "idle" | "sending" | "sent" | "error";

const inputCls =
  "w-full rounded-none border-0 border-b border-line bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-terracotta placeholder:text-fg-soft/70";
const labelCls = "block text-[0.7rem] uppercase tracking-[0.28em] text-fg-soft";

export function LeadForm({ kind, locale, piece }: Props) {
  const t = useTranslations("Contact.form");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      kind,
      locale,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      projectType: kind === "project" ? String(fd.get("projectType") ?? "other") : "sculpture",
      location: String(fd.get("location") ?? ""),
      budget: kind === "project" ? String(fd.get("budget") ?? "unknown") : undefined,
      piece: piece ?? "",
      message: String(fd.get("message") ?? ""),
      consent: fd.get("consent") === "on",
      website: String(fd.get("website") ?? ""),
      turnstileToken: token,
    };

    const local: Record<string, string> = {};
    if (data.name.trim().length < 2) local.name = t("required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) local.email = t("invalidEmail");
    if (data.message.trim().length < 10) local.message = t("tooShort");
    if (!data.consent) local.consent = t("required");
    setErrors(local);
    if (Object.keys(local).length) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = (await res.json().catch(() => ({}))) as { fallback?: string; to?: string };
      if (json.fallback === "mailto" && json.to) {
        const subject = `studio a.c.e · ${data.piece || (kind === "sculpture" ? "Sculpture" : "Projet")} · ${data.name}`;
        const body = [data.message, "", data.name, data.email, data.phone, data.location].filter((l, i) => i < 2 || l).join("\n");
        window.location.href = `mailto:${json.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus("sent");
        form.reset();
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="mt-10 border-l-2 border-terracotta pl-5 text-lg" role="status">{t("success")}</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-8 sm:grid-cols-2">
      <Field label={t("name")} error={errors.name}>
        <input name="name" autoComplete="name" required className={inputCls} />
      </Field>
      <Field label={t("email")} error={errors.email}>
        <input name="email" type="email" autoComplete="email" required className={inputCls} />
      </Field>
      <Field label={t("phone")}>
        <input name="phone" type="tel" autoComplete="tel" className={inputCls} />
      </Field>
      {kind === "project" ? (
        <Field label={t("projectType")}>
          <select name="projectType" className={inputCls} defaultValue="residential">
            {projectTypeOptions.map((o) => (
              <option key={o} value={o}>{t(`projectTypes.${o}`)}</option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label={t("piece")}>
          <input name="pieceDisplay" value={piece ?? ""} readOnly className={`${inputCls} text-fg-soft`} />
        </Field>
      )}
      {kind === "project" && (
        <>
          <Field label={t("location")}>
            <input name="location" className={inputCls} />
          </Field>
          <Field label={t("budget")}>
            <select name="budget" className={inputCls} defaultValue="unknown">
              {budgetOptions.map((o) => (
                <option key={o} value={o}>{t(`budgets.${o}`)}</option>
              ))}
            </select>
          </Field>
        </>
      )}
      <Field label={t("message")} error={errors.message} full>
        <textarea name="message" rows={5} required className={`${inputCls} resize-y`} />
      </Field>

      {/* Honeypot, hidden from humans */}
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="sm:col-span-2 flex items-start gap-3 text-sm text-fg-soft">
        <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-terracotta" />
        <span>{t("consent")}</span>
      </label>
      {errors.consent && <p className="sm:col-span-2 -mt-6 text-sm text-menu">{errors.consent}</p>}

      {siteKey && (
        <div className="sm:col-span-2">
          <Turnstile siteKey={siteKey} onSuccess={setToken} options={{ language: locale, theme: "light" }} />
        </div>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-full bg-terracotta px-8 py-4 text-sm uppercase tracking-[0.22em] text-cream transition-colors hover:bg-terracotta-deep disabled:opacity-60 sm:w-auto"
        >
          {status === "sending" ? t("sending") : t("submit")}
        </button>
        {status === "error" && <p className="mt-4 text-sm text-menu" role="alert">{t("error")}</p>}
      </div>
    </form>
  );
}

function Field({ label, error, full, children }: { label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className={labelCls}>{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-menu">{error}</span>}
    </label>
  );
}
