import { defineRouting } from "next-intl/routing";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/projets": { fr: "/architecture", en: "/architecture" },
    "/projets/[slug]": { fr: "/architecture/[slug]", en: "/architecture/[slug]" },
    "/sculptures": "/sculptures",
    "/sculptures/[slug]": "/sculptures/[slug]",
    "/a-propos": { fr: "/a-propos", en: "/about" },
    "/mentions-legales": { fr: "/mentions-legales", en: "/legal" },
    "/confidentialite": { fr: "/confidentialite", en: "/privacy" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
