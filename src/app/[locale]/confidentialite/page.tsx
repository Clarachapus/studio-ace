import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSite } from "@/lib/content";
import { Section } from "@/components/ui/Section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Legal" });
  return { title: t("privacyTitle"), robots: { index: false } };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, site] = await Promise.all([getTranslations("Legal"), getSite()]);
  const fr = locale === "fr";

  const sections: [string, string][] = fr
    ? [
        ["Données collectées", "Via le formulaire de demande de pièce : nom, email, téléphone (optionnel), message. Aucune autre donnée personnelle n'est collectée. Le site n'utilise pas de cookies de suivi."],
        ["Finalité et base légale", "Répondre à votre demande (base légale : votre consentement, donné en cochant la case du formulaire, et l'exécution de mesures précontractuelles)."],
        ["Destinataires", `${site.legal.companyName} uniquement. Les emails transitent par le prestataire Resend et le formulaire est protégé par Cloudflare Turnstile. La vidéo d'accueil est diffusée par Vimeo, en mode sans suivi.`],
        ["Durée de conservation", "3 ans après le dernier contact, sauf relation contractuelle."],
        ["Vos droits", `Accès, rectification, effacement, opposition, portabilité : écrivez à ${site.publicEmail}. Vous pouvez saisir la CNIL en cas de litige.`],
        ["Hébergement", `${site.legal.host}. Des transferts hors UE peuvent avoir lieu dans le cadre des clauses contractuelles types.`],
      ]
    : [
        ["Data collected", "Through the piece request form: name, email, phone (optional), message. No other personal data is collected. The site uses no tracking cookies."],
        ["Purpose and legal basis", "Answering your request (legal basis: your consent, given by ticking the form checkbox, and pre-contractual steps)."],
        ["Recipients", `${site.legal.companyName} only. Emails are sent through Resend and the form is protected by Cloudflare Turnstile. The home video is streamed by Vimeo, with tracking disabled.`],
        ["Retention", "3 years after the last contact, unless a contract follows."],
        ["Your rights", `Access, rectification, erasure, objection, portability: write to ${site.publicEmail}. You may lodge a complaint with your data protection authority.`],
        ["Hosting", `${site.legal.host}. Transfers outside the EU may occur under standard contractual clauses.`],
      ];

  return (
    <Section mood="editorial" className="pt-10 lg:pt-16">
      <div className="editorial mx-auto max-w-2xl pt-6 lg:pt-12">
        <h1 className="text-4xl lg:text-5xl">{t("privacyTitle")}</h1>
        {sections.map(([h, p]) => (
          <div key={h}>
            <h2 className="mt-12 text-2xl">{h}</h2>
            <p>{p}</p>
          </div>
        ))}
        <p className="mt-12 text-sm text-fg-soft">{fr ? "[À faire relire par un juriste avant mise en ligne.]" : "[To be reviewed by a lawyer before going live.]"}</p>
      </div>
    </Section>
  );
}
