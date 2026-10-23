import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice, getSculpture, getSculptures } from "@/lib/content";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Paragraphs } from "@/components/ui/Paragraphs";
import { LeadForm } from "@/components/forms/LeadForm";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const items = await getSculptures();
  return items.flatMap((s) => [
    { locale: "fr", slug: s.slug },
    { locale: "en", slug: s.slug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const s = await getSculpture(slug);
  if (!s) return {};
  const t = s[locale];
  return { title: t.title, description: t.summary, openGraph: { images: [s.images[0]] } };
}

export default async function SculpturePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, s] = await Promise.all([getTranslations("Sculptures"), getSculpture(slug)]);
  if (!s) notFound();
  const text = s[locale];
  const price = formatPrice(s.price, locale) ?? t("onRequest");
  const [first, ...rest] = s.images;

  return (
    <article>
      <Section mood="brut" className="pt-10 lg:pt-16">
        <Reveal>
          <div className="pt-6 lg:pt-12" data-reveal>
            <Link href="/sculptures" className="text-xs uppercase tracking-[0.22em] text-fg-soft hover:text-fg">← {t("back")}</Link>
          </div>
          <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div className="relative aspect-[4/5] bg-black/30" data-reveal>
              <Image src={first} alt={text.title} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            </div>
            <div className="lg:sticky lg:top-28">
              <h1 className="text-3xl leading-tight lg:text-4xl" data-reveal>{text.title}</h1>
              <p className="mt-6 text-lg text-fg-soft" data-reveal>{text.summary}</p>
              <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-8" data-reveal>
                <Meta label={t("material")} value={s.material} />
                <Meta label={t("dimensions")} value={s.dimensions} />
                <Meta label={t("year")} value={String(s.year)} />
                <Meta label={t("price")} value={s.status === "sold" ? t("status.sold") : price} />
              </dl>
              <div className="mt-8 editorial" data-reveal>
                <Paragraphs text={text.description} />
              </div>
              <a href="#request" className="mt-10 inline-block rounded-full bg-terracotta px-8 py-4 text-sm uppercase tracking-[0.22em] text-cream transition-colors hover:bg-terracotta-deep" data-reveal>
                {t("request")}
              </a>
            </div>
          </div>
          {rest.length > 0 && (
            <div className="mt-20 grid gap-8 md:grid-cols-2">
              {rest.map((src, i) => (
                <div key={src} className="relative aspect-[4/5] bg-black/30" data-reveal>
                  <Image src={src} alt={`${text.title} ${i + 2}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </Section>
      <Section mood="editorial" id="request">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>{t("request")}</Eyebrow>
          <h2 className="mt-4 text-2xl lg:text-3xl">{text.title}</h2>
          <LeadForm kind="sculpture" piece={`${text.title} (${s.slug})`} locale={locale} />
        </div>
      </Section>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-[0.28em] text-fg-soft">{label}</dt>
      <dd className="mt-2 font-display text-lg">{value || "—"}</dd>
    </div>
  );
}
