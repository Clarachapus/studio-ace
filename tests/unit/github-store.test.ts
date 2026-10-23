import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { GitHubContentStore } from "@/lib/content/github-store";
import { isAdminSession, sessionToken } from "@/lib/admin/auth";

type Entry = { name: string; path: string; type: string; sha: string };

/** In-memory stand-in for the GitHub contents API (read, write with version check, delete). */
function fakeGitHub(initial: Record<string, string>) {
  const files = new Map<string, Buffer>();
  const shas = new Map<string, string>();
  const commits: string[] = [];
  let version = 0;
  let failNextPut = false;
  const setFile = (p: string, b: Buffer) => {
    files.set(p, b);
    shas.set(p, `sha${++version}`);
  };
  for (const [p, v] of Object.entries(initial)) setFile(p, Buffer.from(v));

  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));
    const match = url.pathname.match(/^\/repos\/owner\/site\/contents\/(.+)$/);
    if (!match) return new Response(null, { status: 400 });
    const p = decodeURIComponent(match[1]);
    const headers = new Headers(init?.headers);
    if (headers.get("Authorization") !== "Bearer t0k") return new Response(null, { status: 401 });
    const method = init?.method ?? "GET";

    if (method === "GET") {
      if (url.searchParams.get("ref") !== "main") return new Response(null, { status: 400 });
      const file = files.get(p);
      if (file) {
        if (headers.get("Accept") === "application/vnd.github.raw+json") return new Response(new Uint8Array(file));
        return Response.json({ name: p.split("/").pop(), path: p, type: "file", sha: shas.get(p) });
      }
      const prefix = `${p}/`;
      const children = new Map<string, Entry>();
      for (const key of files.keys()) {
        if (!key.startsWith(prefix)) continue;
        const [first, ...rest] = key.slice(prefix.length).split("/");
        children.set(first, { name: first, path: prefix + first, type: rest.length ? "dir" : "file", sha: shas.get(key) ?? "" });
      }
      return children.size ? Response.json([...children.values()]) : new Response(null, { status: 404 });
    }

    const body = JSON.parse(String(init?.body)) as { message: string; content?: string; sha?: string; branch: string };
    if (body.branch !== "main") return new Response(null, { status: 422 });
    if (method === "PUT") {
      if (failNextPut) {
        failNextPut = false;
        return new Response(null, { status: 409 });
      }
      if (files.has(p) ? body.sha !== shas.get(p) : Boolean(body.sha)) return new Response(null, { status: 409 });
      setFile(p, Buffer.from(body.content ?? "", "base64"));
      commits.push(body.message);
      return Response.json({}, { status: 201 });
    }
    if (method === "DELETE") {
      if (body.sha !== shas.get(p)) return new Response(null, { status: 409 });
      files.delete(p);
      shas.delete(p);
      commits.push(body.message);
      return Response.json({});
    }
    return new Response(null, { status: 405 });
  };

  return { files, commits, failNextPut: () => (failNextPut = true), fetchImpl: fetchImpl as typeof fetch };
}

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const firstJson = (dir: string) => readdirSync(path.join(root, dir)).find((n) => n.endsWith(".json") && !n.startsWith("._"))!;

function setup() {
  const sculptureFile = firstJson("content/sculptures");
  const gh = fakeGitHub({
    "content/projects/goncourt.json": read("content/projects/goncourt.json"),
    [`content/sculptures/${sculptureFile}`]: read(`content/sculptures/${sculptureFile}`),
    "content/pages/about.json": read("content/pages/about.json"),
    "content/site.json": read("content/site.json"),
    "content/hero.json": read("content/hero.json"),
  });
  const store = new GitHubContentStore({ token: "t0k", repo: "owner/site", fetchImpl: gh.fetchImpl });
  return { gh, store, sculptureSlug: sculptureFile.replace(/\.json$/, "") };
}

describe("GitHubContentStore (online editor storage)", () => {
  it("reads and saves a project as a commit", async () => {
    const { gh, store } = setup();
    const projects = await store.listProjects();
    expect(projects.map((p) => p.slug)).toEqual(["goncourt"]);
    const project = (await store.getProject("goncourt"))!;
    await store.saveProject({ ...project, year: 2031 });
    expect((await store.getProject("goncourt"))!.year).toBe(2031);
    expect(gh.commits).toEqual(["Éditeur : projet « goncourt »"]);
    expect(await store.getProject("inconnu")).toBeNull();
    expect(await store.getProject("../site")).toBeNull();
  });

  it("saves the about page and site settings, retrying once if the file changed meanwhile", async () => {
    const { gh, store } = setup();
    const about = await store.getAbout();
    gh.failNextPut();
    await store.saveAbout(about);
    const site = await store.getSite();
    await store.saveSite({ ...site, publicEmail: "clara@example.com" });
    expect((await store.getSite()).publicEmail).toBe("clara@example.com");
    expect(gh.commits).toHaveLength(2);
    expect((await store.getHero()).vimeoId).toBeTruthy();
  });

  it("converts an uploaded photo to WebP (2400 px max) inside public/media", async () => {
    const { gh, store, sculptureSlug } = setup();
    const png = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#b85" } }).png().toBuffer();
    const saved = await store.uploadImage("sculptures", sculptureSlug, png, "Photo Atelier.PNG");
    expect(saved).toBe(`/media/sculptures/${sculptureSlug}/01-photo-atelier.webp`);
    const bytes = await store.readBytes(`public${saved}`);
    const meta = await sharp(bytes!).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2400);
    const second = await store.uploadImage("sculptures", sculptureSlug, png, "b.jpg");
    expect(second).toMatch(/\/02-b\.webp$/);
    expect(gh.files.has(`public${second}`)).toBe(true);
  });

  it("deletes a sculpture with its photos", async () => {
    const { gh, store, sculptureSlug } = setup();
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).png().toBuffer();
    await store.uploadImage("sculptures", sculptureSlug, png, "x.png");
    await store.deleteSculpture(sculptureSlug);
    expect(await store.listSculptures()).toEqual([]);
    expect([...gh.files.keys()].some((k) => k.includes(`/sculptures/${sculptureSlug}`))).toBe(false);
  });
});

describe("GitHubContentStore: V2 pages and documents", () => {
  it("returns empty pages until they exist, then saves them as commits", async () => {
    const { gh, store, sculptureSlug } = setup();
    expect(await store.getArchitecturePage()).toEqual({ images: [] });
    expect(await store.getSculpturePage()).toEqual({ groups: [] });
    await store.saveArchitecturePage({ images: ["/media/architecture/diaporama/01-plan.webp"] });
    await store.saveSculpturePage({ groups: [{ image: "/media/sculptures/groupes/01-a.webp", zones: [{ slug: sculptureSlug, x: 10, y: 20, w: 30, h: 40 }] }] });
    expect((await store.getArchitecturePage()).images).toHaveLength(1);
    expect((await store.getSculpturePage()).groups[0].zones[0].slug).toBe(sculptureSlug);
    expect(gh.commits).toEqual(["Éditeur : images de la page Architecture", "Éditeur : photos de groupe des sculptures"]);
  });

  it("stores a PDF as is, under a clean file name", async () => {
    const { gh, store } = setup();
    const pdf = Buffer.from("%PDF-1.4 portfolio");
    const saved = await store.uploadPdf("about", "portfolio", pdf, "Portfolio Clara Chapus 2026.PDF");
    expect(saved).toBe("/media/about/portfolio/portfolio-clara-chapus-2026.pdf");
    expect(gh.files.get(`public${saved}`)?.toString()).toBe("%PDF-1.4 portfolio");
  });
});

describe("editor password session", () => {
  it("accepts only the cookie made from the configured password", async () => {
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "cactus-2026";
    try {
      const good = await sessionToken("cactus-2026");
      expect(good).toMatch(/^[0-9a-f]{64}$/);
      expect(good).not.toContain("cactus");
      expect(await isAdminSession(good)).toBe(true);
      expect(await isAdminSession(await sessionToken("autre"))).toBe(false);
      expect(await isAdminSession(undefined)).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.ADMIN_PASSWORD;
      else process.env.ADMIN_PASSWORD = previous;
    }
  });
});
