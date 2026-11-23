import { expect, test } from "@playwright/test";

/** The Luxe demo business is served through the /s/<slug> fallback path. */
const LUXE = "/s/luxe-musanze";

/** Real seed activity handles. */
const SLUGS = ["gorillas", "golden-monkeys", "caves", "twin-lakes", "village"];

test("each real experience slug returns 200 with all sections", async ({ page }) => {
  for (const slug of SLUGS) {
    const res = await page.goto(`${LUXE}/experiences/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator(".tl")).toHaveCount(1);
    await expect(page.locator(".tl-experience-detail")).toBeVisible();
    await expect(page.locator("h1.tl-section-title")).toBeVisible();
    await expect(page.locator("a.tl-activity-plan")).toHaveAttribute(
      "href",
      `/my-stay?activity=${slug}&group=experience`,
    );
  }
});

test("rw experience page renders Kinyarwanda", async ({ page }) => {
  const res = await page.goto(`${LUXE}/rw/experiences/gorillas`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-experience-detail")).toBeVisible();
});

test("unknown experience slug returns clean 404", async ({ page }) => {
  const res = await page.goto(`${LUXE}/experiences/not-a-real-slug`);
  expect(res?.status()).toBe(404);
  await expect(page.locator(".tl-experience-detail")).toHaveCount(0);
});
