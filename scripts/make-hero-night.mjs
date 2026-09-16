// Night versions of the three hero layers (placeholders, same framing as the day ones).
// Run: node scripts/make-hero-night.mjs
import sharp from "sharp";
import path from "node:path";

const W = 1600, H = 1000;
const out = (name) => path.join(process.cwd(), "public/media/hero", name);
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;

const arch = (x, y, w, h, fill) =>
  `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z" fill="${fill}"/>`;
const stairs = (x, y, step, n, fill, rise = step) => {
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` h${step} v${-rise}`;
  return `<path d="${d} V${y + step * 2} H${x} Z" fill="${fill}"/>`;
};
const cactus = (x, y, h, fill) => `
  <rect x="${x - h * 0.08}" y="${y - h}" width="${h * 0.16}" height="${h}" rx="${h * 0.08}" fill="${fill}"/>
  <rect x="${x - h * 0.36}" y="${y - h * 0.62}" width="${h * 0.12}" height="${h * 0.34}" rx="${h * 0.06}" fill="${fill}"/>
  <rect x="${x - h * 0.36}" y="${y - h * 0.34}" width="${h * 0.3}" height="${h * 0.1}" rx="${h * 0.05}" fill="${fill}"/>
  <rect x="${x + h * 0.24}" y="${y - h * 0.78}" width="${h * 0.12}" height="${h * 0.4}" rx="${h * 0.06}" fill="${fill}"/>
  <rect x="${x + h * 0.06}" y="${y - h * 0.44}" width="${h * 0.3}" height="${h * 0.1}" rx="${h * 0.05}" fill="${fill}"/>`;

// Deterministic "random" stars.
let seed = 7;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const stars = Array.from({ length: 90 }, () => {
  const x = Math.round(rnd() * W), y = Math.round(rnd() * H * 0.55), r = (rnd() * 1.6 + 0.4).toFixed(1), o = (rnd() * 0.6 + 0.3).toFixed(2);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f1e8da" opacity="${o}"/>`;
}).join("");

// Layer 1: night sky in the blue of the logo, moon where the sun was, dark arches.
await sharp(Buffer.from(svg(`
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#06131c"/><stop offset="0.55" stop-color="#112f44"/><stop offset="1" stop-color="#1f4a63"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#f1e8da" stop-opacity="0.35"/><stop offset="1" stop-color="#f1e8da" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>${stars}
  <circle cx="800" cy="300" r="260" fill="url(#glow)"/>
  <circle cx="800" cy="300" r="110" fill="#efe6d8"/>
  <circle cx="845" cy="275" r="100" fill="#112f44" opacity="0.18"/>
  ${arch(260, 260, 300, 740, "rgba(4,12,18,0.55)")}${arch(1040, 200, 360, 800, "rgba(4,12,18,0.55)")}
`))).webp({ quality: 82 }).toFile(out("layer-1-night.webp"));

// Layer 2: cactus silhouettes, almost black blue.
await sharp(Buffer.from(svg(`${cactus(300, 1000, 520, "#0a1822")}${cactus(1320, 1000, 420, "#0a1822")}${cactus(1100, 1000, 260, "#0a1822")}`)))
  .webp({ lossless: true }).toFile(out("layer-2-night.webp"));

// Layer 4: foreground stairs, deepest tone.
await sharp(Buffer.from(svg(`${stairs(-100, 1000, 130, 14, "#050d13", 26)}<rect x="0" y="940" width="${W}" height="60" fill="#050d13"/>`)))
  .webp({ lossless: true }).toFile(out("layer-4-night.webp"));

console.log("hero night layers written");
