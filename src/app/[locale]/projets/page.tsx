import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProjects } from "@/lib/content";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/projects/ProjectCard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Projects" });
  return { title: t("title"), description: t("intro") };
}

/** Architecture: the projects only, in an aligned grid (no categories, no filters). */
export default async function ProjectsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, projects] = await Promise.all([getTranslations("Projects"), getProjects()]);

  return (
    <Section mood="minimal" className="pt-10 lg:pt-16">
      <Reveal>
        <div className="pt-6 lg:pt-12" data-reveal>
          <Eyebrow>{t("title")}</Eyebrow>
          <h1 className="mt-4 text-5xl lg:text-7xl">{t("title")}</h1>
          <p className="mt-6 max-w-2xl text-lg text-fg-soft">{t("intro")}</p>
        </div>
        {projects.length === 0 ? (
          <p className="mt-16 text-fg-soft">{t("empty")}</p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} locale={locale} />
            ))}
          </div>
        )}
      </Reveal>
    </Section>
  );
}
