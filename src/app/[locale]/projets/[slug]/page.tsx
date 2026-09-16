import type { Metadata } from "next";
import { requireLocale, isLocale } from "@/i18n/locale";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProject, getProjects } from "@/lib/content";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Paragraphs } from "@/components/ui/Paragraphs";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.flatMap((p) => [
    { locale: "fr", slug: p.slug },
    { locale: "en", slug: p.slug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = await getProject(slug);
  if (!project) return {};
  const t = project[locale];
  return { title: t.title, description: t.summary, openGraph: { images: [project.cover] } };
}

export default async function ProjectPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, project, all] = await Promise.all([getTranslations("Projects"), getProject(slug), getProjects()]);
  if (!project) notFound();
  const text = project[locale];
  const idx = all.findIndex((p) => p.slug === slug);
  const next = all[(idx + 1) % all.length];

  return (
    <article>
      <div className="relative h-[70svh] min-h-[420px] bg-ochre/20">
        <Image src={project.cover} alt={text.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-sand via-transparent to-transparent" />
      </div>
      <Section mood="minimal" className="-mt-24">
        <Reveal>
          <div data-reveal>
            <Link href="/projets" className="text-xs uppercase tracking-[0.22em] text-fg-soft hover:text-fg">← {t("back")}</Link>
            <h1 className="mt-6 text-5xl lg:text-7xl">{text.title}</h1>
            <p className="mt-4 max-w-2xl text-xl text-fg-soft">{text.summary}</p>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 border-y border-line py-8 md:grid-cols-3" data-reveal>
            <Meta label={t("location")} value={project.location} />
            <Meta label={t("year")} value={String(project.year)} />
            <Meta label={t("surface")} value={project.surface ? `${project.surface} m²` : "—"} />
          </dl>
          <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
            <div className="editorial max-w-prose" data-reveal>
              <Paragraphs text={text.description} />
            </div>
            <div className="grid gap-8">
              {project.gallery.map((src, i) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden bg-ochre/20" data-reveal>
                  <Image src={src} alt={`${text.title} ${i + 2}`} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
          {next && next.slug !== project.slug && (
            <Link href={{ pathname: "/projets/[slug]", params: { slug: next.slug } }} className="mt-24 block border-t border-line pt-10 group" data-reveal>
              <Eyebrow>{t("next")}</Eyebrow>
              <span className="mt-3 block text-4xl lg:text-6xl group-hover:text-menu transition-colors">{next[locale].title} →</span>
            </Link>
          )}
        </Reveal>
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
