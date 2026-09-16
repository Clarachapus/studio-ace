import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAbout, getSite } from "@/lib/content";
import type { AboutEntry } from "@/lib/content/schemas";
import { ArchImage } from "@/components/ui/ArchImage";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ContactLinks } from "@/components/ui/ContactLinks";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const about = await getAbout();
  const a = about[locale];
  return { title: a.title, description: a.intro };
}

/** About, organised like the studio's original site: portrait, biography, projects, exhibitions. */
export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, about, site] = await Promise.all([getTranslations("About"), getAbout(), getSite()]);
  const a = about[locale];

  return (
    <Section mood="editorial" className="pt-10 lg:pt-16">
      <Reveal>
        <div className="grid gap-12 pt-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:pt-12">
          <aside className="lg:sticky lg:top-28 lg:self-start" data-reveal>
            <ArchImage src={about.images.portrait} alt={a.title} sizes="(min-width: 1024px) 34vw, 100vw" priority />
            <ContactLinks
              site={site}
              labels={{ title: t("contactTitle"), email: t("email"), phone: t("phone"), instagram: t("instagram") }}
              className="mt-10"
            />
          </aside>

          <div>
            <div data-reveal>
              <Eyebrow>{t("pageLabel")}</Eyebrow>
              <h1 className="mt-4 text-5xl lg:text-7xl">{a.title}</h1>
              {a.subtitle && <p className="mt-4 text-base text-fg-soft lg:text-lg">{a.subtitle}</p>}
            </div>

            <div className="editorial mt-10 max-w-prose" data-reveal>
              {a.intro && <p className="text-xl leading-relaxed lg:text-2xl">{a.intro}</p>}
              {a.story.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-16 grid gap-12 border-t border-line pt-12 sm:grid-cols-2">
              <EntryList title={t("projectsTitle")} entries={a.projects} />
              <EntryList title={t("exhibitionsTitle")} entries={a.exhibitions} />
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function EntryList({ title, entries }: { title: string; entries: AboutEntry[] }) {
  const shown = entries.filter((e) => e.title);
  if (shown.length === 0) return null;
  return (
    <div data-reveal>
      <Eyebrow>{title}</Eyebrow>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {shown.map((e, i) => (
          <li key={`${i}-${e.title}`} className="flex items-baseline justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-display text-lg">{e.title}</p>
              <p className="text-sm text-fg-soft">{[e.details, e.place].filter(Boolean).join(" · ")}</p>
            </div>
            {e.year && <span className="shrink-0 text-sm tabular-nums text-menu">{e.year}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
