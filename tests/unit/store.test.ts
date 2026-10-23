import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { FsContentStore } from "@/lib/content/store";

const text = { title: "Casa", summary: "s", description: "d" };
let dir: string;
let store: FsContentStore;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "ace-store-"));
  store = new FsContentStore(path.join(dir, "content"), path.join(dir, "public"));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("FsContentStore", () => {
  it("saves, lists sorted by order then year desc, gets and deletes a project", async () => {
    await store.saveProject({ slug: "b", type: "public", location: "", year: 2020, surface: null, cover: "/media/projects/b/1.webp", hover: null, gallery: [], featured: false, order: 1, fr: text, en: text });
    await store.saveProject({ slug: "a", type: "public", location: "", year: 2024, surface: null, cover: "/media/projects/a/1.webp", hover: null, gallery: [], featured: false, order: 1, fr: text, en: text });
    await store.saveProject({ slug: "c", type: "public", location: "", year: 2000, surface: null, cover: "/media/projects/c/1.webp", hover: null, gallery: [], featured: false, order: 0, fr: text, en: text });
    const list = await store.listProjects();
    expect(list.map((p) => p.slug)).toEqual(["c", "a", "b"]);
    expect((await store.getProject("a"))?.year).toBe(2024);
    expect(await store.getProject("zzz")).toBeNull();
    await store.deleteProject("a");
    expect((await store.listProjects()).map((p) => p.slug)).toEqual(["c", "b"]);
  });

  it("refuses an invalid project", async () => {
    await expect(
      store.saveProject({ slug: "Bad Slug", type: "public", location: "", year: 2024, surface: null, cover: "/media/x.webp", hover: null, gallery: [], featured: false, order: 0, fr: text, en: text }),
    ).rejects.toThrow();
  });

  it("writes JSON atomically and readable", async () => {
    await store.saveSculpture({ slug: "s", material: "", dimensions: "", year: 2024, status: "sold", price: 10, images: ["/media/sculptures/s/1.webp"], featured: true, order: 0, fr: text, en: text });
    const raw = JSON.parse(await readFile(path.join(dir, "content", "sculptures", "s.json"), "utf8"));
    expect(raw.status).toBe("sold");
    await expect(stat(path.join(dir, "content", "sculptures", "s.json.tmp"))).rejects.toThrow();
  });

  it("uploads an image as numbered webp under public/media", async () => {
    const png = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: "#b8562e" } }).png().toBuffer();
    const p1 = await store.uploadImage("sculptures", "s", png, "Ma Photo.PNG");
    const p2 = await store.uploadImage("sculptures", "s", png, "other.png");
    expect(p1).toBe("/media/sculptures/s/01-ma-photo.webp");
    expect(p2).toBe("/media/sculptures/s/02-other.webp");
    const meta = await sharp(path.join(dir, "public", p1)).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2400);
  });

  it("gives empty V2 pages until they are saved, and keeps a PDF as is", async () => {
    expect(await store.getArchitecturePage()).toEqual({ images: [] });
    expect(await store.getSculpturePage()).toEqual({ groups: [] });
    await store.saveArchitecturePage({ images: ["/media/architecture/diaporama/01-plan.webp"] });
    expect((await store.getArchitecturePage()).images).toEqual(["/media/architecture/diaporama/01-plan.webp"]);
    const saved = await store.uploadPdf("about", "portfolio", Buffer.from("%PDF-1.4"), "Mon Portfolio.pdf");
    expect(saved).toBe("/media/about/portfolio/mon-portfolio.pdf");
    expect(await readFile(path.join(dir, "public", saved), "utf8")).toBe("%PDF-1.4");
  });
});
