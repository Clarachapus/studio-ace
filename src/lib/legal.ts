import type { Site } from "@/lib/content";

/** Personal data section of the legal notice (former privacy page). */
export function privacySections(site: Site, fr: boolean): [string, string][] {
  // Requests go through Resend only when it is configured on the host; otherwise the visitor's mail app sends them.
  const viaService = Boolean(process.env.RESEND_API_KEY && process.env.LEADS_FROM_EMAIL);
  return fr
    ? [
      ["Données collectées", "Via le formulaire de demande de pièce : nom, email, téléphone (optionnel), message. Aucune autre donnée personnelle n'est collectée. Le site n'utilise pas de cookies de suivi."],
      ["Finalité et base légale", "Répondre à votre demande (base légale : votre consentement, donné en cochant la case du formulaire, et l'exécution de mesures précontractuelles)."],
      ["Destinataires", `${site.legal.companyName} uniquement. ${viaService ? "Les emails transitent par le prestataire Resend." : "Votre message part de votre propre messagerie."} La vidéo d'accueil est diffusée par Vimeo, en mode sans suivi.`],
      ["Durée de conservation", "3 ans après le dernier contact, sauf relation contractuelle."],
      ["Vos droits", `Accès, rectification, effacement, opposition, portabilité : écrivez à ${site.publicEmail}. Vous pouvez saisir la CNIL en cas de litige.`],
      ["Hébergement", `${site.legal.host}. Des transferts hors UE peuvent avoir lieu dans le cadre des clauses contractuelles types.`],
    ]
    : [
      ["Data collected", "Through the piece request form: name, email, phone (optional), message. No other personal data is collected. The site uses no tracking cookies."],
      ["Purpose and legal basis", "Answering your request (legal basis: your consent, given by ticking the form checkbox, and pre-contractual steps)."],
      ["Recipients", `${site.legal.companyName} only. ${viaService ? "Emails are sent through Resend." : "Your message is sent from your own email app."} The home video is streamed by Vimeo, with tracking disabled.`],
      ["Retention", "3 years after the last contact, unless a contract follows."],
      ["Your rights", `Access, rectification, erasure, objection, portability: write to ${site.publicEmail}. You may lodge a complaint with your data protection authority.`],
      ["Hosting", `${site.legal.host}. Transfers outside the EU may occur under standard contractual clauses.`],
    ];
}
