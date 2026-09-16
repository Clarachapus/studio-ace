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
  return { title: t("title"), robots: { index: false } };
}

export default async function LegalPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, site] = await Promise.all([getTranslations("Legal"), getSite()]);
  const fr = locale === "fr";

  return (
    <Section mood="editorial" className="pt-10 lg:pt-16">
      <div className="editorial mx-auto max-w-2xl pt-6 lg:pt-12">
        <h1 className="text-4xl lg:text-5xl">{t("title")}</h1>
        <h2 className="mt-12 text-2xl">{fr ? "Éditeur du site" : "Site publisher"}</h2>
        <p>{site.legal.companyName}<br />{site.address.join(", ")}<br />{fr ? "SIREN" : "Company no."} : {site.legal.siren}<br />{site.publicEmail}{site.phone ? ` · ${site.phone}` : ""}</p>
        <h2 className="mt-12 text-2xl">{fr ? "Hébergement" : "Hosting"}</h2>
        <p>{site.legal.host}</p>
        <h2 className="mt-12 text-2xl">{fr ? "Propriété intellectuelle" : "Intellectual property"}</h2>
        <p>
          {fr
            ? `L'ensemble des contenus de ce site (textes, images, plans, photographies des œuvres) est la propriété de ${site.legal.companyName} ou de ses auteurs. Toute reproduction sans autorisation écrite est interdite.`
            : `All content on this site (texts, images, plans, photographs of works) is the property of ${site.legal.companyName} or its authors. Any reproduction without written permission is prohibited.`}
        </p>
        <h2 className="mt-12 text-2xl">{fr ? "Vente des sculptures" : "Sale of sculptures"}</h2>
        <p>
          {fr
            ? "Les prix affichés sont indicatifs et hors frais de transport. Aucune vente n'est conclue sur ce site : toute demande fait l'objet d'un échange et d'un devis écrit."
            : "Displayed prices are indicative and exclude shipping. No sale is concluded on this site: every request leads to an exchange and a written quote."}
        </p>
        <p className="mt-12 text-sm text-fg-soft">{fr ? "[À faire relire par un juriste avant mise en ligne.]" : "[To be reviewed by a lawyer before going live.]"}</p>
      </div>
    </Section>
  );
}
