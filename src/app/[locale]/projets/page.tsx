import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getArchitecturePage } from "@/lib/content";
import { Slideshow } from "@/components/architecture/Slideshow";
import { mediaInfo } from "@/lib/media-sizes";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Projects" });
  return { title: t("title"), description: t("intro") };
}

/** Architecture, for now: white page, one image at a time and "site under construction". */
export default async function ArchitecturePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, page] = await Promise.all([getTranslations("Projects"), getArchitecturePage()]);
  const slides = await Promise.all(page.images.map(async (src) => ({ src, drawing: (await mediaInfo(src)).drawing })));

  return (
    <section className="page-white bg-bg">
      <h1 className="sr-only">{t("title")}</h1>
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-center px-5 pb-16 pt-24 sm:px-8 lg:min-h-[calc(100svh-5rem)] lg:px-12 lg:pt-28">
        <Slideshow slides={slides} label={t("construction")} />
      </div>
    </section>
  );
}
