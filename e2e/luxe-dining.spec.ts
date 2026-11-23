import { expect, test } from "@playwright/test";

/** The Luxe demo business is served through the /s/<slug> fallback path. */
const LUXE = "/s/luxe-musanze";

/** Real seed dish names (visible on the page). */
const DISH_NAMES = ["Goat brochettes", "Isombe & rice", "Rwandan coffee"];

test("Luxe dining page returns 200 with real seed dishes", async ({ page }) => {
  const res = await page.goto(`${LUXE}/dining`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl")).toHaveCount(1);
  await expect(page.locator(".tl-dining")).toBeVisible();
  for (const name of DISH_NAMES) {
    await expect(page.locator(`text=${name}`).first()).toBeVisible();
  }
  await expect(page.locator("a.tl-dish-reserve")).toHaveCount(DISH_NAMES.length);
});

test("rw dining page renders Kinyarwanda", async ({ page }) => {
  const res = await page.goto(`${LUXE}/rw/dining`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-dining")).toBeVisible();
  await expect(page.locator("text=Fata ameza").first()).toBeVisible();
});

test("dining Reserve a table links to /my-stay with group and item params", async ({ page }) => {
  await page.goto(`${LUXE}/dining`);
  await expect(page.locator("a.tl-dish-reserve").first()).toHaveAttribute(
    "href",
    /\/my-stay\?group=.*&item=brochettes/,
  );
});
