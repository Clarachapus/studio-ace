// Generates placeholder images (WebP) so the template renders before real photos exist.
// Run: node scripts/make-placeholders.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const P = {
  sand: "#EFE6D8",
  cream: "#F7F1E7",
  terracotta: "#B8562E",
  brown: "#4A2B1F",
  black: "#1E1512",
  ochre: "#D99A5B",
};

const arch = (x, y, w, h, fill) =>
  `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z" fill="${fill}"/>`;

const stairs = (x, y, step, n, fill, rise = step) => {
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` h${step} v${-rise}`;
  d += ` V${y + step * 2} H${x} Z`;
  return `<path d="${d}" fill="${fill}"/>`;
};

const cactus = (x, y, h, fill) => `
  <rect x="${x - h * 0.08}" y="${y - h}" width="${h * 0.16}" height="${h}" rx="${h * 0.08}" fill="${fill}"/>
  <rect x="${x - h * 0.36}" y="${y - h * 0.62}" width="${h * 0.12}" height="${h * 0.34}" rx="${h * 0.06}" fill="${fill}"/>
  <rect x="${x - h * 0.36}" y="${y - h * 0.34}" width="${h * 0.3}" height="${h * 0.1}" rx="${h * 0.05}" fill="${fill}"/>
  <rect x="${x + h * 0.24}" y="${y - h * 0.78}" width="${h * 0.12}" height="${h * 0.4}" rx="${h * 0.06}" fill="${fill}"/>
  <rect x="${x + h * 0.06}" y="${y - h * 0.44}" width="${h * 0.3}" height="${h * 0.1}" rx="${h * 0.05}" fill="${fill}"/>`;

const label = (w, h, txt) =>
  `<text x="${w / 2}" y="${h - 40}" font-family="Georgia, serif" font-size="${Math.round(w / 40)}" fill="rgba(30,21,18,0.45)" text-anchor="middle" letter-spacing="4">${txt}</text>`;

function svg(w, h, body, bg = null) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${body}</svg>`;
}

const grad = (id, a, b, vertical = true) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

async function write(rel, svgString, { transparent = false } = {}) {
  const file = path.join(root, "public", rel);
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svgString)).webp({ quality: 80, alphaQuality: 90, lossless: transparent }).toFile(file);
  console.log("wrote", rel);
}

// --- Hero layers (1600x1000). Layers 2 and 4 are transparent PNG-like WebP.
{
  const w = 1600, h = 1000;
  await write(
    "media/hero/layer-1.webp",
    svg(w, h, `${grad("g", P.ochre, P.terracotta)}<rect width="${w}" height="${h}" fill="url(#g)"/>
      ${arch(260, 260, 300, 740, "rgba(74,43,31,0.35)")}${arch(1040, 200, 360, 800, "rgba(74,43,31,0.35)")}
      <circle cx="800" cy="300" r="120" fill="${P.cream}" opacity="0.9"/>`),
  );
  await write(
    "media/hero/layer-2.webp",
    svg(w, h, `${cactus(300, 1000, 520, P.brown)}${cactus(1320, 1000, 420, P.brown)}${cactus(1100, 1000, 260, P.brown)}`),
    { transparent: true },
  );
  await write(
    "media/hero/layer-4.webp",
    svg(w, h, `${stairs(-100, 1000, 130, 14, P.black, 26)}<rect x="0" y="940" width="${w}" height="60" fill="${P.black}"/>`),
    { transparent: true },
  );
}

// --- Projects: cover 1600x1000 (sand, minimal) + gallery 1400x1000
const projects = ["casa-arco", "escalera-blanca", "atelier-nopal", "patio-sol", "casa-luz", "terraza-norte"];
for (const [i, slug] of projects.entries()) {
  const w = 1600, h = 1000;
  const motifs = [
    arch(560, 180, 480, 820, P.terracotta),
    stairs(200, 900, 120, 10, P.terracotta),
    `${arch(300, 300, 320, 700, P.ochre)}${arch(980, 300, 320, 700, P.terracotta)}`,
    `<circle cx="800" cy="420" r="260" fill="${P.ochre}"/>${stairs(900, 1000, 100, 7, P.terracotta)}`,
    `${arch(200, 250, 260, 750, P.terracotta)}${arch(670, 250, 260, 750, P.terracotta)}${arch(1140, 250, 260, 750, P.terracotta)}`,
    `${cactus(350, 1000, 650, P.terracotta)}${arch(800, 300, 500, 700, P.ochre)}`,
  ];
  const motif = motifs[i % motifs.length];
  await write(`media/projects/${slug}/01-cover.webp`, svg(w, h, `${motif}${label(w, h, slug.toUpperCase() + " · JOUR")}`, P.sand));
  // Night view: same scene, dark sky and a warm window glow.
  await write(
    `media/projects/${slug}/01-cover-night.webp`,
    svg(w, h, `${grad("n", "#2A1C16", P.black)}<rect width="${w}" height="${h}" fill="url(#n)"/><circle cx="1300" cy="180" r="70" fill="${P.cream}" opacity="0.85"/>${motif.replaceAll(P.terracotta, "#E8A15A").replaceAll(P.ochre, "#F2C98A")}<text x="${w / 2}" y="${h - 40}" font-family="Georgia, serif" font-size="40" fill="rgba(247,241,231,0.5)" text-anchor="middle" letter-spacing="4">${slug.toUpperCase()} · NUIT</text>`),
  );
  for (let g = 2; g <= 4; g++) {
    await write(
      `media/projects/${slug}/0${g}.webp`,
      svg(1400, 1000, `${grad("g", P.cream, P.sand)}<rect width="1400" height="1000" fill="url(#g)"/>${
        g % 2 ? arch(500, 200, 400, 800, P.ochre) : stairs(100, 850, 110, 12, P.terracotta)
      }${label(1400, 1000, slug.toUpperCase() + " · " + g)}`),
    );
  }
}

// --- Sculptures: 1200x1500 portrait on brown (brut)
const sculptures = ["arco-i", "nopal", "escalera", "luna-de-barro"];
for (const [i, slug] of sculptures.entries()) {
  const w = 1200, h = 1500;
  const motifs = [
    arch(300, 400, 600, 900, P.terracotta),
    cactus(600, 1300, 900, P.terracotta),
    stairs(150, 1250, 150, 6, P.terracotta),
    `<circle cx="600" cy="750" r="380" fill="${P.ochre}"/>`,
  ];
  for (let g = 1; g <= 2; g++) {
    await write(
      `media/sculptures/${slug}/0${g}.webp`,
      svg(w, h, `${grad("g", P.brown, P.black)}<rect width="${w}" height="${h}" fill="url(#g)"/>${motifs[i]}${
        g === 2 ? `<rect width="${w}" height="${h}" fill="rgba(0,0,0,0.25)"/>` : ""
      }<text x="${w / 2}" y="${h - 60}" font-family="Georgia, serif" font-size="30" fill="rgba(247,241,231,0.5)" text-anchor="middle" letter-spacing="4">${slug.toUpperCase()} · ${g}</text>`),
    );
  }
}

// --- About
await write("media/about/portrait.webp", svg(1200, 1500, `${arch(250, 350, 700, 1150, P.terracotta)}${label(1200, 1500, "PORTRAIT")}`, P.cream));
await write("media/about/workshop.webp", svg(1600, 1000, `${cactus(400, 1000, 600, P.ochre)}${stairs(700, 950, 120, 8, P.terracotta)}${label(1600, 1000, "ATELIER")}`, P.sand));
