import "server-only";
import { cache } from "react";
import { getContentStore } from "./store";
import type { Locale } from "@/i18n/routing";
import type { LocalizedText, Project, Sculpture } from "./schemas";

export type { About, ArchitecturePage, Hero, Project, Sculpture, SculpturePage, Site } from "./schemas";

const store = () => getContentStore();

export const getProjects = cache(() => store().listProjects());
export const getProject = cache((slug: string) => store().getProject(slug));
export const getSculptures = cache(() => store().listSculptures());
export const getSculpture = cache((slug: string) => store().getSculpture(slug));
export const getAbout = cache(() => store().getAbout());
export const getSite = cache(() => store().getSite());
export const getHero = cache(() => store().getHero());
export const getArchitecturePage = cache(() => store().getArchitecturePage());
export const getSculpturePage = cache(() => store().getSculpturePage());

export function text(entry: Project | Sculpture, locale: Locale): LocalizedText {
  return entry[locale];
}

export function formatPrice(price: number | null, locale: Locale): string | null {
  if (price === null) return null;
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}
