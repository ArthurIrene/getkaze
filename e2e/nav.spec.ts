import { expect, test, type Page } from "@playwright/test";

/** Site navigation: a <details> menu on phones, inline links on desktop, no JavaScript needed. */

async function openMenu(page: Page) {
  const menu = page.locator("details.fj-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  return menu.locator("nav");
}

test("phone menu opens with the site pages and Check availability", async ({ page }) => {
  await page.goto("/");
  const panel = await openMenu(page);
  await expect(panel.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  await expect(panel.getByRole("link", { name: "Check availability" })).toBeVisible();
});

test("language pills keep the page; logo links home", async ({ page }) => {
  await page.goto("/rw");
  await expect(page.locator(".fj-logo")).toHaveAttribute("href", "/rw");
  await expect(page.locator('.fj-pills a[hreflang="en"]')).toHaveAttribute("href", "/");
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });
  test("links are inline and there is no burger", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".fj-menu summary")).toBeHidden();
    await expect(page.locator(".fj-nav-inline").getByRole("link", { name: "Home" })).toBeVisible();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the menu still opens", async ({ page }) => {
    await page.goto("/");
    const panel = await openMenu(page);
    await expect(panel.getByRole("link", { name: "Home" })).toBeVisible();
  });
});
