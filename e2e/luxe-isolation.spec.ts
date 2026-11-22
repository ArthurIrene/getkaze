import { expect, test } from "@playwright/test";

/** Luxe CSS and code never load on Field Journal pages (isolation, D-066). */
test("Luxe CSS and JS never load on Field Journal pages", async ({ page }) => {
  for (const path of ["/", "/rooms"]) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);

    // No Luxe stylesheet linked.
    await expect(page.locator('link[href="/luxe.css"]')).toHaveCount(0);
    // No Luxe client script.
    await expect(page.locator('script[src*="luxe"]')).toHaveCount(0);
    // No Luxe-scoped markup leaked into the page.
    await expect(page.locator('.tl')).toHaveCount(0);

    // The Field Journal page itself still renders normally.
    await expect(page.locator("h1").first()).toBeVisible();
  }
});
