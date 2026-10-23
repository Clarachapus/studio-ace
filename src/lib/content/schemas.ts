import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug: lowercase letters, digits and dashes only");

const mediaPath = z
  .string()
  .regex(/^\/media\/[a-z0-9/_.-]+$/i, "image path must start with /media/");

/** A file stored on the site (/media/...) or a link to another website. */
const fileOrLink = z.union([mediaPath, z.string().url()]);

export const localizedTextSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(""),
  description: z.string().default(""),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const projectTypes = ["residential", "public", "interior", "landscape"] as const;
export type ProjectType = (typeof projectTypes)[number];

export const projectSchema = z.object({
  slug: slugSchema,
  type: z.enum(projectTypes),
  location: z.string().default(""),
  year: z.number().int().min(1900).max(2100),
  surface: z.number().positive().nullable().default(null),
  cover: mediaPath,
  /** Optional second view (e.g. at night) shown on hover / touch. */
  hover: mediaPath.nullable().default(null),
  gallery: z.array(mediaPath).default([]),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  fr: localizedTextSchema,
  en: localizedTextSchema,
});
export type Project = z.infer<typeof projectSchema>;

export const sculptureStatuses = ["available", "sold", "commission"] as const;
export type SculptureStatus = (typeof sculptureStatuses)[number];

export const sculptureSchema = z.object({
  slug: slugSchema,
  material: z.string().default(""),
  dimensions: z.string().default(""),
  year: z.number().int().min(1900).max(2100),
  status: z.enum(sculptureStatuses),
  /** Price in euros, or null for "on request". */
  price: z.number().nonnegative().nullable().default(null),
  images: z.array(mediaPath).min(1),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  fr: localizedTextSchema,
  en: localizedTextSchema,
});
export type Sculpture = z.infer<typeof sculptureSchema>;

const aboutEntrySchema = z.object({
  title: z.string().default(""),
  details: z.string().default(""),
  place: z.string().default(""),
  year: z.string().default(""),
});
export type AboutEntry = z.infer<typeof aboutEntrySchema>;

const aboutLocaleSchema = z.object({
  title: z.string().min(1),
  /** Short line under the name, e.g. "Architect, urbanist and artist". */
  subtitle: z.string().default(""),
  intro: z.string().default(""),
  projects: z.array(aboutEntrySchema).default([]),
  exhibitions: z.array(aboutEntrySchema).default([]),
  acronym: z.object({
    arch: z.string().default(""),
    cactus: z.string().default(""),
    stairs: z.string().default(""),
  }),
  story: z.array(z.string()).default([]),
  workshop: z.string().default(""),
  team: z
    .array(z.object({ name: z.string(), role: z.string(), bio: z.string().default("") }))
    .default([]),
});

export const aboutSchema = z.object({
  images: z.object({
    portrait: mediaPath,
    workshop: mediaPath,
  }),
  /** Portfolio offered for download on the About page: a PDF on the site or a link. */
  portfolio: fileOrLink.nullable().default(null),
  fr: aboutLocaleSchema,
  en: aboutLocaleSchema,
});
export type About = z.infer<typeof aboutSchema>;

const seoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const siteSchema = z.object({
  name: z.string().min(1),
  /** Inbox that receives the leads. */
  leadsEmail: z.string().email(),
  publicEmail: z.string().email(),
  phone: z.string().default(""),
  address: z.array(z.string()).default([]),
  social: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .default([]),
  legal: z.object({
    companyName: z.string().default(""),
    siren: z.string().default(""),
    host: z.string().default("Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA"),
  }),
  fr: z.object({ seo: seoSchema, tagline: z.string().default("") }),
  en: z.object({ seo: seoSchema, tagline: z.string().default("") }),
});
export type Site = z.infer<typeof siteSchema>;

export const heroSchema = z.object({
  layer1: mediaPath,
  layer2: mediaPath,
  layer4: mediaPath,
  /** Night versions, shown when the site is in dark mode. Optional. */
  layer1Night: mediaPath.nullable().default(null),
  layer2Night: mediaPath.nullable().default(null),
  layer4Night: mediaPath.nullable().default(null),
  /** Background video (MP4, muted loop) replacing layer 1. The layer 1 image is its poster. */
  video: mediaPath.nullable().default(null),
  videoNight: mediaPath.nullable().default(null),
  /** Vimeo video shown full screen in the hero (takes precedence over the layers). */
  vimeoId: z.string().regex(/^\d+$/).nullable().default(null),
  /** Width / height of the Vimeo video, to cover the screen without black bars. */
  vimeoRatio: z.number().positive().default(16 / 9),
  vimeoPoster: z.string().url().nullable().default(null),
  title: z.string().min(1),
});
export type Hero = z.infer<typeof heroSchema>;

/** Architecture page: a slideshow of images (plans, photos) under "site under construction". */
export const architecturePageSchema = z.object({
  images: z.array(mediaPath).default([]),
});
export type ArchitecturePage = z.infer<typeof architecturePageSchema>;

/** A clickable area of a group photo, in percent of the image (0 to 100). */
export const groupZoneSchema = z.object({
  slug: slugSchema,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().gt(0).max(100),
  h: z.number().gt(0).max(100),
});
export type GroupZone = z.infer<typeof groupZoneSchema>;

/** Sculpture page: extra group photos showing several works, each one clickable. */
export const sculpturePageSchema = z.object({
  groups: z
    .array(z.object({ image: mediaPath, zones: z.array(groupZoneSchema).default([]) }))
    .default([]),
});
export type SculpturePage = z.infer<typeof sculpturePageSchema>;
