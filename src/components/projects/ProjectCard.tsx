import { Link } from "@/i18n/navigation";
import { HoverSwap } from "@/components/ui/HoverSwap";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/lib/content";

/** A project in the Architecture grid: straight-edged photo (day/night on hover), title, place and year. */
export function ProjectCard({ project, locale }: { project: Project; locale: Locale }) {
  const t = project[locale];
  return (
    <Link href={{ pathname: "/projets/[slug]", params: { slug: project.slug } }} className="group block" data-reveal>
      <div className="relative aspect-[4/5] overflow-hidden bg-ochre/20">
        <HoverSwap front={project.cover} back={project.hover} alt={t.title} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl lg:text-2xl">{t.title}</h3>
        <span className="whitespace-nowrap text-xs uppercase tracking-[0.22em] text-fg-soft">{project.year}</span>
      </div>
      {project.location && <p className="mt-1 text-sm text-fg-soft">{project.location}</p>}
    </Link>
  );
}
