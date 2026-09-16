import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead } from "./schema";

const isDev = process.env.NODE_ENV === "development";

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return isDev; // no key configured: allow in dev only
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const json = (await res.json()) as { success: boolean };
  return json.success === true;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function leadToHtml(lead: Lead): string {
  const rows: [string, string][] = [
    ["Type", lead.kind],
    ["Langue", lead.locale],
    ["Nom", lead.name],
    ["Email", lead.email],
    ["Téléphone", lead.phone],
    ["Type de projet", lead.projectType ?? ""],
    ["Lieu", lead.location],
    ["Budget", lead.budget ?? ""],
    ["Pièce", lead.piece],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join("");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1e1512">
    <h2 style="font-weight:400">Nouvelle demande · ${lead.kind === "sculpture" ? "Sculpture" : "Projet"}</h2>
    <table>${table}</table>
    <p style="white-space:pre-wrap;margin-top:16px;border-left:3px solid #6e1e2b;padding-left:12px">${escapeHtml(lead.message)}</p>
  </div>`;
}

/**
 * Sends the lead by email through Resend. Without an API key (local dev),
 * the lead is logged and appended to .leads/leads.jsonl instead.
 */
export async function deliverLead(lead: Lead, opts: { leadsEmail: string; siteName: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEADS_FROM_EMAIL;

  if (!apiKey || !from) {
    if (!isDev) throw new Error("Lead delivery is not configured (RESEND_API_KEY / LEADS_FROM_EMAIL).");
    const dir = path.join(process.cwd(), ".leads");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "leads.jsonl"), JSON.stringify({ ...lead, receivedAt: new Date().toISOString() }) + "\n");
    console.info("[leads] dev mode: lead saved to .leads/leads.jsonl", lead.email);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const subject = `${opts.siteName} · ${lead.kind === "sculpture" ? "Demande sculpture" : "Demande projet"} · ${lead.name}`;
  const { error } = await resend.emails.send({
    from,
    to: [opts.leadsEmail],
    replyTo: lead.email,
    subject,
    html: leadToHtml(lead),
  });
  if (error) throw new Error(error.message);

  const confirm =
    lead.locale === "fr"
      ? `<p>Bonjour ${escapeHtml(lead.name)},</p><p>Nous avons bien reçu votre message et revenons vers vous rapidement.</p><p>${escapeHtml(opts.siteName)}</p>`
      : `<p>Hello ${escapeHtml(lead.name)},</p><p>We have received your message and will get back to you shortly.</p><p>${escapeHtml(opts.siteName)}</p>`;
  await resend.emails.send({
    from,
    to: [lead.email],
    subject: lead.locale === "fr" ? `${opts.siteName} · Message reçu` : `${opts.siteName} · Message received`,
    html: confirm,
  });
}
