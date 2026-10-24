import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const jsonFiles = (dir: string) => readdirSync(path.join(process.cwd(), dir)).filter((f) => f.endsWith(".json") && !f.startsWith("._"));
const readJson = (file: string) => JSON.parse(readFileSync(path.join(process.cwd(), file), "utf8"));
const sculptures = jsonFiles("content/sculptures").map((f) => readJson(`content/sculptures/${f}`) as { slug: string; images: string[]; fr: { title: string } });
const shownCount = sculptures.reduce((n, s) => n + Math.min(s.images.length, 2), 0);
const visibleText = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && (e.textContent ?? "").trim(); }).length);
const projectSlug = jsonFiles("content/projects")[0]?.replace(/\.json$/, "") ?? "goncourt";

test("home is a single screen: the video, the name and the menu only", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.locator("h1")).toContainText("studio a.c.e");
  await expect(page.getByRole("navigation", { name: "Entrer dans le site" })).toHaveCount(0);
  // Only the three sections: the language switch (FR/EN) also lives in this navigation.
  const menu = page.getByRole("navigation", { name: "Rubriques du site" }).locator('a[href^="/fr/"]');
  await expect(menu).toHaveCount(3);
  await expect(menu.nth(0)).toHaveAttribute("href", "/fr/sculptures");
  await expect(menu.nth(1)).toHaveAttribute("href", "/fr/architecture");
  await expect(menu.nth(2)).toHaveAttribute("href", "/fr/a-propos");
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
});

test("pages scroll with the mouse wheel after arriving from the home", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("navigation", { name: "Rubriques du site" }).getByRole("link", { name: "À propos" }).click();
  await expect(page).toHaveURL(/\/fr\/a-propos$/);
  await page.waitForTimeout(800);
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(100);
});

test("menu is plain text in bordeaux and the mouse pointer is a bordeaux dot", async ({ page }) => {
  await page.goto("/fr/sculptures");
  const current = page.getByRole("navigation", { name: "Rubriques du site" }).locator('a[aria-current="page"]');
  await expect(current).toHaveCSS("color", "rgb(110, 30, 43)");
  await expect(current).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.mouse.move(300, 300);
  const dot = page.locator(".ace-cursor");
  await expect(dot).toHaveAttribute("data-visible", "true");
  await expect(dot).toHaveCSS("background-color", "rgb(110, 30, 43)");
  expect(await page.evaluate(() => document.documentElement.classList.contains("has-custom-cursor"))).toBe(true);
});

test("logo sits at the bottom centre of the home, in cream by day and by night", async ({ page }) => {
  await page.goto("/fr");
  const logo = page.getByRole("img", { name: "studio a.c.e" });
  await expect(logo).toBeVisible();
  const box = (await logo.boundingBox())!;
  const vw = page.viewportSize()!.width;
  const vh = page.viewportSize()!.height;
  expect(Math.abs(box.x + box.width / 2 - vw / 2)).toBeLessThan(2);
  expect(box.y + box.height).toBeGreaterThan(vh * 0.85);
  await expect(logo).toHaveCSS("background-color", "rgb(247, 241, 231)");
  await page.getByRole("button", { name: "Passer en mode nuit" }).first().click();
  await expect(logo).toHaveCSS("background-color", "rgb(247, 241, 231)", { timeout: 3000 });
  expect((await page.request.get("/media/brand/logo-mask.png")).status()).toBe(200);
});

test("the bordeaux cursor dot has no outline", async ({ page }) => {
  await page.goto("/fr/a-propos");
  await page.mouse.move(200, 200);
  await expect(page.locator(".ace-cursor")).toHaveCSS("box-shadow", "none");
});

test("footer shows the studio a.c.e logo centred in bordeaux, and no orange remains", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/fr/a-propos");
  const logo = page.getByTestId("footer-logo");
  await logo.scrollIntoViewIfNeeded();
  await expect(logo).toHaveCSS("background-color", "rgb(110, 30, 43)");
  const box = await logo.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - 720)).toBeLessThan(3);
  const orange = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => {
    const c = getComputedStyle(el);
    return [c.color, c.backgroundColor, c.borderTopColor].some((v) => v === "rgb(184, 86, 46)" || v === "rgb(217, 154, 91)");
  }).length);
  expect(orange).toBe(0);
});

test("architecture is a white page with one image at a time under 'site en construction' and a crane", async ({ page }) => {
  await page.goto("/fr/architecture");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator("header")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  expect(await visibleText(page, "main h1")).toBe(0);
  await expect(page.getByText("ARCHITECTURE", { exact: true })).toHaveCount(0);
  const show = page.getByTestId("architecture-slideshow");
  const label = show.getByText("Site en construction");
  await expect(label).toBeVisible();
  await expect(label).toHaveCSS("color", "rgb(110, 30, 43)");
  await expect(show.locator("svg")).toBeVisible();
  const active = () => show.locator('img[data-active="true"]').getAttribute("src");
  const first = await active();
  await expect.poll(active, { timeout: 3500 }).not.toBe(first);
});

test("sculpture page shows at most two photos per work, without titles or text, in rows of mixed formats", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/fr/sculptures");
  const links = page.locator('main ul li[data-kind="photo"] a[href^="/fr/sculptures/"]');
  await expect(links).toHaveCount(shownCount);
  expect(await visibleText(page, "main h1, main h2, main h3, main p")).toBe(0);
  const boxes = await page.locator("main ul > li[data-kind]").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), w: r.width, h: r.height }; }));
  const ratios = new Set(boxes.map((b) => (b.w / b.h).toFixed(1)));
  expect(ratios.size).toBeGreaterThan(1);
  const firstRow = boxes.filter((b) => b.top === boxes[0].top);
  expect(firstRow.length).toBeGreaterThan(1);
  for (const b of firstRow) expect(Math.abs(b.h - firstRow[0].h)).toBeLessThan(2);
  for (const work of sculptures) {
    await expect(page.locator(`main ul li[data-kind="photo"] a[href="/fr/sculptures/${work.slug}"]`)).toHaveCount(Math.min(work.images.length, 2));
  }
});

test("header highlights the page you are on", async ({ page }) => {
  await page.goto("/fr/architecture");
  const current = page.getByRole("navigation", { name: "Rubriques du site" }).locator('a[aria-current="page"]');
  await expect(current).toHaveText("Architecture");
});

test("hero shows the studio's Vimeo video in background mode", async ({ page }) => {
  await page.goto("/fr");
  const frame = page.locator(".hero-vimeo iframe");
  await expect(frame).toHaveCount(1);
  const src = await frame.getAttribute("src");
  expect(src).toContain("player.vimeo.com/video/1222712043");
  for (const param of ["background=1", "muted=1", "loop=1", "dnt=1"]) expect(src).toContain(param);
});

test("architecture project sheets stay reachable by their address", async ({ page }) => {
  const res = await page.goto(`/fr/architecture/${projectSlug}`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
});

test("night mode keeps texts and logo in bordeaux, and turns plans into white lines on the night blue", async ({ page }) => {
  await page.goto("/fr/architecture");
  await page.getByRole("button", { name: "Passer en mode nuit" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const bordeaux = "rgb(110, 30, 43)";
  await expect(page.getByRole("navigation", { name: "Rubriques du site" }).locator('a[aria-current="page"]')).toHaveCSS("color", bordeaux);
  await expect(page.getByTestId("architecture-slideshow").getByText("Site en construction")).toHaveCSS("color", bordeaux);
  await expect(page.getByTestId("footer-logo")).toHaveCSS("background-color", bordeaux);
  const slides = await page.getByTestId("architecture-slideshow").locator("img").evaluateAll((imgs) =>
    imgs.map((i) => ({ drawing: i.classList.contains("slide-drawing"), filter: getComputedStyle(i).filter, blend: getComputedStyle(i).mixBlendMode })),
  );
  const plans = slides.filter((x) => x.drawing);
  expect(plans.length).toBeGreaterThan(0);
  for (const x of plans) expect([x.filter, x.blend]).toEqual(["invert(1) grayscale(1) contrast(1.25)", "screen"]);
  for (const x of slides.filter((y) => !y.drawing)) expect(x.filter).toBe("none");
  await page.getByRole("button", { name: "Passer en mode jour" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const dayFilters = await page.getByTestId("architecture-slideshow").locator("img.slide-drawing").evaluateAll((imgs) => imgs.map((i) => getComputedStyle(i).filter));
  for (const f of dayFilters) expect(f).toBe("none");
});

test("sculpture sheet: small title and a 'Contact' button leading to the form", async ({ page }) => {
  const work = sculptures[0];
  await page.goto("/en/sculptures");
  await page.locator(`main a[href="/en/sculptures/${work.slug}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/en/sculptures/${work.slug}$`));
  const size = await page.locator("h1").evaluate((h) => parseFloat(getComputedStyle(h).fontSize));
  expect(size).toBeLessThanOrEqual(40);
  await expect(page.getByText("Request this piece")).toHaveCount(0);
  await page.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});

test("about: a 'Contact' block, the phone number on one line, Instagram with its logo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/fr/a-propos");
  await expect(page.getByText("Nous joindre")).toHaveCount(0);
  await expect(page.locator("main").getByText("Contact", { exact: true })).toBeVisible();
  await expect(page.locator('main a[href^="mailto:"]').first()).toBeVisible();
  // The phone is optional (set in the editor): when shown, it fits on one line.
  if (readJson("content/site.json").phone) {
    const tel = page.locator('main a[href^="tel:"]').first();
    const lineHeight = await tel.evaluate((a) => parseFloat(getComputedStyle(a).lineHeight));
    const box = await tel.boundingBox();
    expect(box!.height).toBeLessThan(lineHeight * 1.5 + 22);
  }
  const insta = page.locator('main a[href*="instagram.com/studio_a.c.e"]').first();
  await expect(insta.locator("svg")).toBeVisible();
  await expect(insta).toContainText("studio a.c.e");
});

test("footer: Instagram logo before the studio name, legal notice under it, privacy link gone", async ({ page, request }) => {
  await page.goto("/fr/a-propos");
  const footer = page.locator("footer");
  const insta = footer.locator('a[href*="instagram.com"]');
  await expect(insta.locator("svg")).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Confidentialité" })).toHaveCount(0);
  const legal = footer.getByRole("link", { name: "Mentions légales" });
  await expect(legal).toBeVisible();
  expect((await legal.boundingBox())!.y).toBeGreaterThan((await insta.boundingBox())!.y);
  const res = await request.get("/fr/confidentialite");
  expect(res.url()).toMatch(/\/fr\/mentions-legales$/);
  await page.goto("/fr/mentions-legales");
  await expect(page.getByRole("heading", { name: "Données personnelles" })).toBeVisible();
});

test("the contact page and menu entry are gone", async ({ page, request }) => {
  expect((await request.get("/fr/contact")).status()).toBe(404);
  await page.goto("/fr");
  await expect(page.locator('header a[href="/fr/contact"]')).toHaveCount(0);
});

test("root redirects to default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
});

test("admin is hidden in production", async ({ request }) => {
  expect((await request.get("/admin")).status()).toBe(404);
  expect((await request.get("/api/admin/projects")).status()).toBe(404);
});

test("published without an email service, a valid request falls back to the visitor's mail app", async ({ request }) => {
  const res = await request.post("/api/leads", {
    data: { kind: "sculpture", locale: "fr", name: "Test Visiteur", email: "visiteur@example.com", message: "Bonjour, cette pièce est-elle disponible ?", consent: true, piece: "Oaxaca" },
  });
  const json = await res.json();
  expect(json.fallback).toBe("mailto");
  expect(json.to).toContain("@");
});

test("leads API validates input", async ({ request }) => {
  const res = await request.post("/api/leads", { data: { kind: "project", locale: "fr", name: "x", email: "bad", message: "hi", consent: true } });
  expect(res.status()).toBe(400);
});

test("sun/moon toggle switches the whole site to night and remembers it", async ({ page }) => {
  await page.goto("/fr/a-propos");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", "dark");
  const bodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const dayBg = await bodyBg();
  await page.getByRole("button", { name: "Passer en mode nuit" }).first().click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect.poll(bodyBg, { timeout: 3000 }).not.toBe(dayBg);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Passer en mode jour" }).first().click();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("inner pages share the site background", async ({ page }) => {
  await page.goto("/fr/a-propos");
  const colours = await page.evaluate(() => [
    getComputedStyle(document.body).backgroundColor,
    ...[...document.querySelectorAll("main section[class*='mood-']")].map((s) => getComputedStyle(s).backgroundColor),
  ]);
  expect(new Set(colours).size).toBe(1);
});

test("sculptures come in a random order, without status labels, and open their pages", async ({ page, request }) => {
  const orders = new Set<string>();
  for (let i = 0; i < 8; i++) {
    const html = await (await request.get("/fr/sculptures")).text();
    orders.add([...html.matchAll(/src="([^"]*\/media\/sculptures\/[^"]+)"/g)].map((m) => m[1]).join(","));
  }
  expect(orders.size).toBeGreaterThan(1);

  await page.goto("/fr/sculptures");
  await expect(page.getByRole("button", { name: "Toutes" })).toHaveCount(0);
  for (const label of ["Disponible", "Vendue", "Sur commande"]) {
    await expect(page.locator("main a").getByText(label, { exact: true })).toHaveCount(0);
  }
  for (const [slug, name] of [["oaxaca", "Oaxaca"], ["chapultepec", "Chapultepec"]] as const) {
    await page.goto(`/fr/sculptures/${slug}`);
    await expect(page.locator("h1")).toHaveText(name);
  }
});

test("browser tab icon is the cactus", async ({ page, request }) => {
  await page.goto("/fr");
  const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(href).toMatch(/icon/);
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("#B8562E");
});

test("hero video is plain black and white with a sound button", async ({ page }) => {
  await page.goto("/fr");
  const frame = page.locator(".hero-vimeo iframe");
  await expect.poll(() => frame.evaluate((el) => getComputedStyle(el).filter)).toBe("grayscale(1)");
  const on = page.getByRole("button", { name: "Activer le son" });
  await expect(on).toBeVisible();
  await on.click();
  await expect(page.getByRole("button", { name: "Couper le son" })).toHaveAttribute("aria-pressed", "true");
});

test("about page follows the studio's structure: bio, projects and exhibitions", async ({ page }) => {
  await page.goto("/en/about");
  await expect(page.locator("h1")).toHaveText("Clara Chapus");
  await expect(page.getByText("working between Paris and Mexico City")).toBeVisible();
  await expect(page.getByText("Projects", { exact: true })).toBeVisible();
  await expect(page.getByText("Exhibitions", { exact: true })).toBeVisible();
  await expect(page.getByText("Mujeres Creadoras").first()).toBeVisible();
  await expect(page.getByText("A. C. E.")).toHaveCount(0);
});

test("the whole site uses Graphik", async ({ page }) => {
  await page.goto("/fr/a-propos");
  await page.evaluate(() => document.fonts.ready);
  const families = await page.evaluate(() => [getComputedStyle(document.querySelector("h1")!).fontFamily, getComputedStyle(document.body).fontFamily]);
  for (const f of families) expect(f.toLowerCase()).toContain("brand");
  expect(await page.evaluate(() => [...document.fonts].some((f) => f.status === "loaded"))).toBe(true);
});

test("icon files browsers ask for exist, and odd paths never crash", async ({ request }) => {
  expect((await request.get("/favicon.ico")).status()).toBe(200);
  expect((await request.get("/apple-touch-icon.png")).status()).toBe(200);
  for (const p of ["/wp-login.php", "/fr.json", "/sitemap.txt", "/xx.png"]) {
    expect((await request.get(p)).status(), p).toBeLessThan(500);
  }
});

test.describe("iPhone layout", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const p of ["/fr", "/en", "/fr/architecture", `/fr/architecture/${projectSlug}`, "/fr/sculptures", "/fr/sculptures/oaxaca", "/fr/a-propos", "/fr/mentions-legales"]) {
    test(`${p} never scrolls sideways`, async ({ page }) => {
      await page.goto(p);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const { scrollWidth, width } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth }));
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  }

  test("bottom tab bar: three large buttons that show where you are", async ({ page }) => {
    await page.goto("/fr/a-propos");
    const bar = page.getByRole("navigation", { name: "Rubriques du site" });
    const links = bar.getByRole("link");
    await expect(links).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(bar.getByRole("link", { name: "À propos" })).toHaveAttribute("aria-current", "page");
    await bar.getByRole("link", { name: "Sculpture", exact: true }).click();
    await expect(page).toHaveURL(/\/fr\/sculptures$/);
  });

  test("home fits the phone screen without scrolling", async ({ page }) => {
    await page.goto("/fr");
    const fits = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1);
    expect(fits).toBe(true);
  });
});
