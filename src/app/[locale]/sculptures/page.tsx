import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSculptures } from "@/lib/content";
import { shuffle } from "@/lib/shuffle";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { SculptureCard } from "@/components/sculptures/SculptureCard";

// A new random order on every visit, so the page never looks the same twice.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Sculptures" });
  return { title: t("title"), description: t("intro") };
}

export default async function SculpturesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, sculptures] = await Promise.all([getTranslations("Sculptures"), getSculptures()]);
  const list = shuffle(sculptures);

  return (
    <Section mood="brut" className="pt-10 lg:pt-16">
      <Reveal>
        <div className="pt-6 lg:pt-12" data-reveal>
          <Eyebrow>{t("title")}</Eyebrow>
          <h1 className="mt-4 text-6xl leading-[0.9] lg:text-[9rem]">{t("title")}</h1>
          <p className="mt-8 max-w-2xl text-lg text-fg-soft">{t("intro")}</p>
        </div>
        {list.length === 0 ? (
          <p className="mt-16 text-fg-soft">{t("empty")}</p>
        ) : (
          <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-10 md:gap-y-14">
            {list.map((s) => (
              <SculptureCard key={s.slug} sculpture={s} locale={locale} statusLabel={t(`status.${s.status}`)} onRequestLabel={t("onRequest")} variant="compact" />
            ))}
          </div>
        )}
      </Reveal>
    </Section>
  );
}
