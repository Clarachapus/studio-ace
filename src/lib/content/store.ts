import { promises as fs } from "node:fs";
import path from "node:path";
import {
  aboutSchema,
  architecturePageSchema,
  heroSchema,
  sculpturePageSchema,
  projectSchema,
  sculptureSchema,
  siteSchema,
  slugSchema,
  type About,
  type ArchitecturePage,
  type Hero,
  type SculpturePage,
  type Project,
  type Sculpture,
  type Site,
} from "./schemas";

export type MediaKind = "projects" | "sculptures" | "about" | "hero" | "architecture";

/**
 * Everything the site and the editor know about content goes through this
 * interface. V1 is backed by JSON files on disk (FsContentStore). V2 can swap
 * in an online database without touching the editor UI or the pages.
 */
export interface ContentStore {
  listProjects(): Promise<Project[]>;
  getProject(slug: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(slug: string): Promise<void>;

  listSculptures(): Promise<Sculpture[]>;
  getSculpture(slug: string): Promise<Sculpture | null>;
  saveSculpture(sculpture: Sculpture): Promise<void>;
  deleteSculpture(slug: string): Promise<void>;

  getAbout(): Promise<About>;
  saveAbout(about: About): Promise<void>;
  getSite(): Promise<Site>;
  saveSite(site: Site): Promise<void>;
  getHero(): Promise<Hero>;
  getArchitecturePage(): Promise<ArchitecturePage>;
  saveArchitecturePage(page: ArchitecturePage): Promise<void>;
  getSculpturePage(): Promise<SculpturePage>;
  saveSculpturePage(page: SculpturePage): Promise<void>;

  /** Stores an image and returns its public path (starting with /media/). */
  uploadImage(kind: MediaKind, slug: string, file: File | Buffer, originalName: string): Promise<string>;
  /** Stores a PDF as is and returns its public path (starting with /media/). */
  uploadPdf(kind: MediaKind, slug: string, file: File | Buffer, originalName: string): Promise<string>;
}

/** File name safe for a URL: lowercase letters, digits and dashes, at most 40 characters. */
export function safeBaseName(originalName: string, fallback = "image"): string {
  return (
    originalName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || fallback
  );
}

export class ContentNotFoundError extends Error {}

function sortByOrder<T extends { order: number; year: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || b.year - a.year);
}

export class FsContentStore implements ContentStore {
  constructor(
    private readonly contentDir: string,
    private readonly publicDir: string,
  ) {}

  private async readJson<T>(file: string, parse: (raw: unknown) => T): Promise<T> {
    const raw = await fs.readFile(file, "utf8");
    return parse(JSON.parse(raw));
  }

  private async writeJson(file: string, data: unknown): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file);
  }

  private async listDir<T>(dir: string, parse: (raw: unknown) => T): Promise<T[]> {
    let names: string[] = [];
    try {
      names = await fs.readdir(dir);
    } catch {
      return [];
    }
    const jsonFiles = names.filter((n) => n.endsWith(".json") && !n.startsWith("._"));
    return Promise.all(jsonFiles.map((n) => this.readJson(path.join(dir, n), parse)));
  }

  private entryPath(kind: "projects" | "sculptures", slug: string): string {
    slugSchema.parse(slug);
    return path.join(this.contentDir, kind, `${slug}.json`);
  }

  async listProjects(): Promise<Project[]> {
    return sortByOrder(await this.listDir(path.join(this.contentDir, "projects"), (r) => projectSchema.parse(r)));
  }

  async getProject(slug: string): Promise<Project | null> {
    try {
      return await this.readJson(this.entryPath("projects", slug), (r) => projectSchema.parse(r));
    } catch {
      return null;
    }
  }

  async saveProject(project: Project): Promise<void> {
    const valid = projectSchema.parse(project);
    await this.writeJson(this.entryPath("projects", valid.slug), valid);
  }

  async deleteProject(slug: string): Promise<void> {
    await fs.rm(this.entryPath("projects", slug), { force: true });
    await fs.rm(path.join(this.publicDir, "media", "projects", slug), { recursive: true, force: true });
  }

  async listSculptures(): Promise<Sculpture[]> {
    return sortByOrder(await this.listDir(path.join(this.contentDir, "sculptures"), (r) => sculptureSchema.parse(r)));
  }

  async getSculpture(slug: string): Promise<Sculpture | null> {
    try {
      return await this.readJson(this.entryPath("sculptures", slug), (r) => sculptureSchema.parse(r));
    } catch {
      return null;
    }
  }

  async saveSculpture(sculpture: Sculpture): Promise<void> {
    const valid = sculptureSchema.parse(sculpture);
    await this.writeJson(this.entryPath("sculptures", valid.slug), valid);
  }

  async deleteSculpture(slug: string): Promise<void> {
    await fs.rm(this.entryPath("sculptures", slug), { force: true });
    await fs.rm(path.join(this.publicDir, "media", "sculptures", slug), { recursive: true, force: true });
  }

  getAbout(): Promise<About> {
    return this.readJson(path.join(this.contentDir, "pages", "about.json"), (r) => aboutSchema.parse(r));
  }

  async saveAbout(about: About): Promise<void> {
    await this.writeJson(path.join(this.contentDir, "pages", "about.json"), aboutSchema.parse(about));
  }

  getSite(): Promise<Site> {
    return this.readJson(path.join(this.contentDir, "site.json"), (r) => siteSchema.parse(r));
  }

  async saveSite(site: Site): Promise<void> {
    await this.writeJson(path.join(this.contentDir, "site.json"), siteSchema.parse(site));
  }

  getHero(): Promise<Hero> {
    return this.readJson(path.join(this.contentDir, "hero.json"), (r) => heroSchema.parse(r));
  }

  /** Optional pages: an empty page when the file does not exist yet. */
  private async readPage<T>(name: string, parse: (raw: unknown) => T): Promise<T> {
    try {
      return await this.readJson(path.join(this.contentDir, "pages", `${name}.json`), parse);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return parse({});
      throw err;
    }
  }

  getArchitecturePage(): Promise<ArchitecturePage> {
    return this.readPage("architecture", (r) => architecturePageSchema.parse(r));
  }

  async saveArchitecturePage(page: ArchitecturePage): Promise<void> {
    await this.writeJson(path.join(this.contentDir, "pages", "architecture.json"), architecturePageSchema.parse(page));
  }

  getSculpturePage(): Promise<SculpturePage> {
    return this.readPage("sculptures", (r) => sculpturePageSchema.parse(r));
  }

  async saveSculpturePage(page: SculpturePage): Promise<void> {
    await this.writeJson(path.join(this.contentDir, "pages", "sculptures.json"), sculpturePageSchema.parse(page));
  }

  async uploadPdf(kind: MediaKind, slug: string, file: File | Buffer, originalName: string): Promise<string> {
    slugSchema.parse(slug);
    const input = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
    const dir = path.join(this.publicDir, "media", kind, slug);
    await fs.mkdir(dir, { recursive: true });
    const name = `${safeBaseName(originalName, "document")}.pdf`;
    await fs.writeFile(path.join(dir, name), input);
    return `/media/${kind}/${slug}/${name}`;
  }

  async uploadImage(kind: MediaKind, slug: string, file: File | Buffer, originalName: string): Promise<string> {
    slugSchema.parse(slug);
    const { default: sharp } = await import("sharp");
    const input = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
    const dir = path.join(this.publicDir, "media", kind, slug);
    await fs.mkdir(dir, { recursive: true });
    const existing = (await fs.readdir(dir)).filter((n) => !n.startsWith("._"));
    const base = originalName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
    const name = `${String(existing.length + 1).padStart(2, "0")}-${base}.webp`;
    await sharp(input)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(dir, name));
    return `/media/${kind}/${slug}/${name}`;
  }
}

let defaultStore: ContentStore | null = null;

/** Store bound to the repository's content/ and public/ folders. */
export function getContentStore(): ContentStore {
  if (!defaultStore) {
    const root = process.cwd();
    defaultStore = new FsContentStore(path.join(root, "content"), path.join(root, "public"));
  }
  return defaultStore;
}
