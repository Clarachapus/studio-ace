import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProjects, getSculptures } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [projects, sculptures] = await Promise.all([getProjects(), getSculptures()]);
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    const add = (href: Parameters<typeof getPathname>[0]["href"]) =>
      entries.push({ url: base + getPathname({ locale, href }), lastModified: new Date() });
    add("/");
    add("/projets");
    add("/sculptures");
    add("/a-propos");
    for (const p of projects) add({ pathname: "/projets/[slug]", params: { slug: p.slug } });
    for (const s of sculptures) add({ pathname: "/sculptures/[slug]", params: { slug: s.slug } });
  }
  return entries;
}
