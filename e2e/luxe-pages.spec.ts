import { expect, test } from "@playwright/test";

/** The Luxe demo business is served through the /s/<slug> fallback path. */
const LUXE = "/s/luxe-musanze";

/** Page ids Luxe builds (mirrors templates/luxe/pages.ts). */
const built = ["", "/rooms", "/contact", "/book", "/privacy"];

/** Page ids Luxe does not build (must return a clean 404). */
const notBuilt = ["/experiences", "/my-stay", "/credits", "/not-a-page"];

test("each built Luxe page returns 200 on the Luxe demo", async ({ page }) => {
  for (const path of built) {
    const res = await page.goto(`${LUXE}${path}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator(".tl")).toHaveCount(1);
    expect(await page.locator('link[href="/luxe.css"]').count()).toBeGreaterThanOrEqual(1);
  }
});

test("Luxe rooms page renders rooms from SiteView", async ({ page }) => {
  const res = await page.goto(`${LUXE}/rooms`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-room-block").first()).toBeVisible();
});

test("Luxe contact page renders contact buttons", async ({ page }) => {
  const res = await page.goto(`${LUXE}/contact`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-contact-btn").first()).toBeVisible();
});

test("Luxe book page renders the request form", async ({ page }) => {
  const res = await page.goto(`${LUXE}/book`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("form#tl-book")).toBeVisible();
});

test("Luxe privacy page renders the notice", async ({ page }) => {
  const res = await page.goto(`${LUXE}/privacy`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-legal")).toBeVisible();
});

test("Luxe pages not built return 404", async ({ page }) => {
  for (const path of notBuilt) {
    const res = await page.goto(`${LUXE}${path}`);
    expect(res?.status()).toBe(404);
  }
});
