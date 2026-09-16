import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireLocale } from "@/i18n/locale";
import { getHero, getSite } from "@/lib/content";
import { ParallaxHero } from "@/components/home/ParallaxHero";

/** Home = one screen: the studio's video and name. Navigation is the menu at the top. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, hero, site] = await Promise.all([getTranslations("Home"), getHero(), getSite()]);

  return (
    <div id="accueil" data-tone="dark">
      <ParallaxHero
        hero={hero}
        tagline={site[locale].tagline}
        scrollLabel={t("scroll")}
        mode="stage"
        soundLabels={{ on: t("soundOn"), off: t("soundOff") }}
      />
    </div>
  );
}
