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
import { safeBaseName, type ContentStore, type MediaKind } from "./store";

export type GitHubStoreConfig = { token: string; repo: string; branch?: string; fetchImpl?: typeof fetch };

type Entry = { name: string; path: string; type: string };

const API = "https://api.github.com";

function sortByOrder<T extends { order: number; year: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || b.year - a.year);
}

/**
 * Online editor storage: every save is a commit in the site's GitHub repository.
 * The host (Vercel) rebuilds the public site after each commit, so changes go live
 * about a minute later, and every past version stays in the history.
 */
export class GitHubContentStore implements ContentStore {
  private readonly fetchImpl: typeof fetch;
  private readonly branch: string;

  constructor(private readonly cfg: GitHubStoreConfig) {
    this.fetchImpl = cfg.fetchImpl ?? ((input, init) => fetch(input, init));
    this.branch = cfg.branch || "main";
  }

  private contentsUrl(filePath: string, withRef = false): string {
    const encoded = filePath.split("/").map(encodeURIComponent).join("/");
    return `${API}/repos/${this.cfg.repo}/contents/${encoded}${withRef ? `?ref=${encodeURIComponent(this.branch)}` : ""}`;
  }

  private headers(accept = "application/vnd.github+json"): Record<string, string> {
    return {
      Authorization: `Bearer ${this.cfg.token}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "studio-ace-editor",
    };
  }

  private async request(filePath: string, accept?: string): Promise<Response | null> {
    const res = await this.fetchImpl(this.contentsUrl(filePath, true), { headers: this.headers(accept), cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub a répondu ${res.status} en lisant ${filePath}`);
    return res;
  }

  async readBytes(filePath: string): Promise<Buffer | null> {
    const res = await this.request(filePath, "application/vnd.github.raw+json");
    return res ? Buffer.from(await res.arrayBuffer()) : null;
  }

  private async readText(filePath: string): Promise<string | null> {
    const res = await this.request(filePath, "application/vnd.github.raw+json");
    return res ? res.text() : null;
  }

  private async list(dir: string): Promise<Entry[]> {
    const res = await this.request(dir);
    if (!res) return [];
    const body: unknown = await res.json();
    return Array.isArray(body) ? (body as Entry[]) : [];
  }

  private async sha(filePath: string): Promise<string | null> {
    const res = await this.request(filePath);
    if (!res) return null;
    const body: unknown = await res.json();
    if (Array.isArray(body) || typeof body !== "object" || body === null) return null;
    const sha = (body as { sha?: unknown }).sha;
    return typeof sha === "string" ? sha : null;
  }

  private async put(filePath: string, content: Buffer, message: string): Promise<void> {
    let lastStatus = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const sha = await this.sha(filePath);
      const res = await this.fetchImpl(this.contentsUrl(filePath), {
        method: "PUT",
        headers: { ...this.headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ message, content: content.toString("base64"), branch: this.branch, ...(sha ? { sha } : {}) }),
      });
      if (res.ok) return;
      lastStatus = res.status;
      // 409/422: the file changed between reading its version and writing; read again and retry.
      if (res.status !== 409 && res.status !== 422) break;
    }
    throw new Error(`GitHub a refusé l'enregistrement de ${filePath} (${lastStatus})`);
  }

  private async remove(filePath: string, message: string): Promise<void> {
    const sha = await this.sha(filePath);
    if (!sha) return;
    const res = await this.fetchImpl(this.contentsUrl(filePath), {
      method: "DELETE",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch: this.branch }),
    });
    if (!res.ok && res.status !== 404) throw new Error(`GitHub a refusé la suppression de ${filePath} (${res.status})`);
  }

  private async removeDir(dir: string, message: string): Promise<void> {
    for (const entry of await this.list(dir)) {
      if (entry.type === "dir") await this.removeDir(entry.path, message);
      else await this.remove(entry.path, message);
    }
  }

  private async readJson<T>(filePath: string, parse: (raw: unknown) => T): Promise<T | null> {
    const text = await this.readText(filePath);
    return text === null ? null : parse(JSON.parse(text));
  }

  private async mustReadJson<T>(filePath: string, parse: (raw: unknown) => T): Promise<T> {
    const value = await this.readJson(filePath, parse);
    if (value === null) throw new Error(`${filePath} introuvable`);
    return value;
  }

  private jsonBuffer(data: unknown): Buffer {
    return Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  private async listEntries<T>(kind: "projects" | "sculptures", parse: (raw: unknown) => T): Promise<T[]> {
    const files = (await this.list(`content/${kind}`)).filter(
      (e) => e.type === "file" && e.name.endsWith(".json") && !e.name.startsWith("._"),
    );
    const items = await Promise.all(files.map((e) => this.readJson(e.path, parse)));
    return items.filter((item): item is Awaited<T> => item !== null) as T[];
  }

  async listProjects(): Promise<Project[]> {
    return sortByOrder(await this.listEntries("projects", (r) => projectSchema.parse(r)));
  }

  async getProject(slug: string): Promise<Project | null> {
    if (!slugSchema.safeParse(slug).success) return null;
    return this.readJson(`content/projects/${slug}.json`, (r) => projectSchema.parse(r));
  }

  async saveProject(project: Project): Promise<void> {
    const valid = projectSchema.parse(project);
    await this.put(`content/projects/${valid.slug}.json`, this.jsonBuffer(valid), `Éditeur : projet « ${valid.slug} »`);
  }

  async deleteProject(slug: string): Promise<void> {
    slugSchema.parse(slug);
    const message = `Éditeur : suppression du projet « ${slug} »`;
    await this.remove(`content/projects/${slug}.json`, message);
    await this.removeDir(`public/media/projects/${slug}`, message);
  }

  async listSculptures(): Promise<Sculpture[]> {
    return sortByOrder(await this.listEntries("sculptures", (r) => sculptureSchema.parse(r)));
  }

  async getSculpture(slug: string): Promise<Sculpture | null> {
    if (!slugSchema.safeParse(slug).success) return null;
    return this.readJson(`content/sculptures/${slug}.json`, (r) => sculptureSchema.parse(r));
  }

  async saveSculpture(sculpture: Sculpture): Promise<void> {
    const valid = sculptureSchema.parse(sculpture);
    await this.put(`content/sculptures/${valid.slug}.json`, this.jsonBuffer(valid), `Éditeur : sculpture « ${valid.slug} »`);
  }

  async deleteSculpture(slug: string): Promise<void> {
    slugSchema.parse(slug);
    const message = `Éditeur : suppression de la sculpture « ${slug} »`;
    await this.remove(`content/sculptures/${slug}.json`, message);
    await this.removeDir(`public/media/sculptures/${slug}`, message);
  }

  getAbout(): Promise<About> {
    return this.mustReadJson("content/pages/about.json", (r) => aboutSchema.parse(r));
  }

  async saveAbout(about: About): Promise<void> {
    await this.put("content/pages/about.json", this.jsonBuffer(aboutSchema.parse(about)), "Éditeur : page À propos");
  }

  getSite(): Promise<Site> {
    return this.mustReadJson("content/site.json", (r) => siteSchema.parse(r));
  }

  async saveSite(site: Site): Promise<void> {
    await this.put("content/site.json", this.jsonBuffer(siteSchema.parse(site)), "Éditeur : coordonnées et infos du site");
  }

  getHero(): Promise<Hero> {
    return this.mustReadJson("content/hero.json", (r) => heroSchema.parse(r));
  }

  async getArchitecturePage(): Promise<ArchitecturePage> {
    return (await this.readJson("content/pages/architecture.json", (r) => architecturePageSchema.parse(r))) ?? architecturePageSchema.parse({});
  }

  async saveArchitecturePage(page: ArchitecturePage): Promise<void> {
    await this.put("content/pages/architecture.json", this.jsonBuffer(architecturePageSchema.parse(page)), "Éditeur : images de la page Architecture");
  }

  async getSculpturePage(): Promise<SculpturePage> {
    return (await this.readJson("content/pages/sculptures.json", (r) => sculpturePageSchema.parse(r))) ?? sculpturePageSchema.parse({});
  }

  async saveSculpturePage(page: SculpturePage): Promise<void> {
    await this.put("content/pages/sculptures.json", this.jsonBuffer(sculpturePageSchema.parse(page)), "Éditeur : photos de groupe des sculptures");
  }

  async uploadPdf(kind: MediaKind, slug: string, file: File | Buffer, originalName: string): Promise<string> {
    slugSchema.parse(slug);
    const input = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
    const name = `${safeBaseName(originalName, "document")}.pdf`;
    await this.put(`public/media/${kind}/${slug}/${name}`, input, `Éditeur : document ${name}`);
    return `/media/${kind}/${slug}/${name}`;
  }

  async uploadImage(kind: MediaKind, slug: string, file: File | Buffer, originalName: string): Promise<string> {
    slugSchema.parse(slug);
    const { default: sharp } = await import("sharp");
    const input = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
    const dir = `public/media/${kind}/${slug}`;
    const existing = (await this.list(dir)).filter((e) => !e.name.startsWith("._"));
    const base =
      originalName
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "image";
    const name = `${String(existing.length + 1).padStart(2, "0")}-${base}.webp`;
    const output = await sharp(input)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await this.put(`${dir}/${name}`, output, `Éditeur : photo ${name} (${kind}/${slug})`);
    return `/media/${kind}/${slug}/${name}`;
  }
}
