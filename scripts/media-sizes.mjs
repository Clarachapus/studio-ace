// Records the width and height of every image in public/media, so pages can lay out
// photos of mixed formats (portrait, landscape, square) without waiting for them to load.
// Runs before each build: the online editor commits new photos, the host rebuilds, sizes stay current.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = path.join(root, "public", "media");
const out = path.join(root, "src", "generated", "media-sizes.json");
const exts = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith("._") && !e.name.startsWith("."))
      .map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return files.flat();
}

/** A plan or line drawing: mostly white paper (more than 60 % near-white pixels). */
export async function isDrawing(file) {
  const { data } = await sharp(file).flatten({ background: "#ffffff" }).greyscale().resize(96, 96, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let white = 0;
  for (const v of data) if (v > 225) white++;
  return white / data.length > 0.6;
}

const sizes = {};
for (const file of (await walk(mediaDir)).sort()) {
  if (!exts.has(path.extname(file).toLowerCase())) continue;
  try {
    const meta = await sharp(file).metadata();
    const swap = (meta.orientation ?? 1) >= 5;
    const w = swap ? meta.height : meta.width;
    const h = swap ? meta.width : meta.height;
    if (!w || !h) continue;
    const key = "/" + path.relative(path.join(root, "public"), file).split(path.sep).join("/");
    sizes[key] = (await isDrawing(file)) ? [w, h, 1] : [w, h];
  } catch {
    // Unreadable file: the page falls back to a square frame.
  }
}
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify(sizes, null, 1) + "\n");
console.log(`media-sizes: ${Object.keys(sizes).length} images, ${Object.values(sizes).filter((v) => v[2]).length} plans`);
