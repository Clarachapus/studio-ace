import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSculpturePage, getSculptures } from "@/lib/content";
import { shuffle } from "@/lib/shuffle";
import { mediaRatio } from "@/lib/media-sizes";
import { Mosaic, type MosaicItem } from "@/components/sculptures/Mosaic";

// A new random order on every visit, so the page never looks the same twice.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Sculptures" });
  return { title: t("title"), description: t("intro") };
}

/** Sculpture: photos only, up to two per work plus the group photos, in a random order. */
export default async function SculpturesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, sculptures, page] = await Promise.all([getTranslations("Sculptures"), getSculptures(), getSculpturePage()]);
  const titles = new Map(sculptures.map((s) => [s.slug, s[locale].title]));
  const ratio = async (src: string) => (await mediaRatio(src)) ?? 1;

  // At most two photos per work, so none repeats too much: its main photo and one other, at random.
  const pick = (images: string[]) => [images[0], ...shuffle(images.slice(1)).slice(0, 1)].filter(Boolean);
  const photos = sculptures.flatMap((s) =>
    pick(s.images).map(async (src): Promise<MosaicItem> => ({ kind: "photo", key: `${s.slug}:${src}`, src, ratio: await ratio(src), slug: s.slug, title: s[locale].title })),
  );
  const groups = page.groups.map(
    async (g, i): Promise<MosaicItem> => ({
      kind: "group",
      key: `group:${i}:${g.image}`,
      src: g.image,
      ratio: await ratio(g.image),
      // A zone pointing to a deleted sculpture simply disappears.
      zones: g.zones.flatMap((z) => (titles.has(z.slug) ? [{ ...z, title: titles.get(z.slug)! }] : [])),
    }),
  );
  const items = shuffle(await Promise.all([...photos, ...groups]));

  return (
    <section className="bg-bg">
      <h1 className="sr-only">{t("title")}</h1>
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-24 sm:px-8 lg:px-12 lg:pt-32">
        {items.length === 0 ? <p className="text-fg-soft">{t("empty")}</p> : <Mosaic items={items} label={t("mosaic")} />}
      </div>
    </section>
  );
}
