import { expect, test } from "@playwright/test";
import { demoPhotos } from "../apps/web/src/data/demo-photos";

/**
 * Demo photos (specs/demo-photos.md): the demo shows its openly licensed
 * photos, below-the-fold photos lazy-load, and the Photo credits page lists
 * every CC BY photo. Works with the bundled demo and with the database seed.
 */
const ccBy = Object.values(demoPhotos).filter((p) => p.credit.licence.startsWith("cc-by-"));

test("the hero photo loads at once; photos below the fold are lazy and load when reached", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".fj-hero-img");
  await expect(hero).toHaveAttribute("src", /\/demo-photos\/hero-volcanoes\/1440\.webp$/);
  await expect(hero).toHaveAttribute("srcset", /\/demo-photos\/hero-volcanoes\/960\.webp 960w/);
  await expect(hero).not.toHaveAttribute("loading", "lazy");
  await expect.poll(() => hero.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);

  // Below the first view: URLs wait in data-src until the photo comes near (parts/lazy-img.tsx).
  const below = page.locator('main img[data-src*="/demo-photos/"], main img[src*="/demo-photos/"]:not(.fj-hero-img)');
  expect(await below.count()).toBeGreaterThanOrEqual(5);
  const waiting = await page.locator('main img[data-src*="/demo-photos/"]').count();
  expect(waiting, "photos far below the first view are not fetched yet").toBeGreaterThanOrEqual(4);
  for (const img of await below.all()) await expect(img).toHaveAttribute("loading", "lazy");

  // Scroll through the page: every photo loads (no broken image).
  for (const img of await below.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
  }
});

test("rooms show their photos, and every photo file answers as WebP", async ({ page, request }) => {
  await page.goto("/rooms");
  const photos = page.locator('.fj-room-block img[data-src*="/demo-photos/"], .fj-room-block img[src*="/demo-photos/"]');
  expect(await photos.count()).toBeGreaterThanOrEqual(5);
  for (const img of await photos.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
  }
  for (const p of Object.values(demoPhotos)) {
    const res = await request.get(`/${p.path}/480.webp`);
    expect(res.status(), p.path).toBe(200);
    expect(res.headers()["content-type"], p.path).toContain("image/webp");
  }
});

test("the footer links Photo credits, and the page lists every CC BY photo with author, source and licence", async ({ page }) => {
  expect(ccBy.length).toBeGreaterThan(0);
  await page.goto("/");
  await page.locator(".fj-footer").getByRole("link", { name: "Photo credits" }).click();
  await expect(page).toHaveURL(/\/credits$/);
  await expect(page.locator("h1")).toHaveText("Photo credits");
  for (const p of ccBy) {
    const item = page.locator('[data-credit="by"]').filter({ has: page.locator(`a[href="${p.credit.source_url}"]`) });
    await expect(item, p.path).toHaveCount(1);
    await expect(item).toContainText(p.credit.author);
    await expect(item).toContainText(`CC BY ${p.credit.licence.slice(6)}`);
    await expect(item.locator(`a[href="${p.credit.licence_url}"]`)).toHaveCount(1);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBe(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("photos still show (the <noscript> copy, native lazy loading)", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator('main noscript').count()).toBeGreaterThanOrEqual(5);
    const html = await page.content();
    expect(html).toContain('loading="lazy"');
  });
});

test("the Kinyarwanda credits page has its title in Kinyarwanda", async ({ page }) => {
  await page.goto("/rw/credits");
  await expect(page.locator("h1")).toHaveText("Abafashe amafoto");
});
