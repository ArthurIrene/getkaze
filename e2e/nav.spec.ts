import { expect, test, type Page } from "@playwright/test";

/**
 * Site navigation (specs/site-navigation.md): a <details> menu on phones,
 * inline links on desktop, no JavaScript needed. Nav = Rooms, Contact; the
 * name links home. One "Check availability" per screen: the bottom bar on
 * phones, the header button on desktop. The header is sticky on every page.
 */

/** The header's box and whether its background is solid. */
async function header(page: Page) {
  return page.locator(".fj-header").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, height: r.height, bg: getComputedStyle(el).backgroundColor };
  });
}
const solid = (bg: string) => bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg);

async function openMenu(page: Page) {
  const menu = page.locator("details.fj-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  return menu.locator("nav");
}

test("phone menu opens with Rooms and Contact only; Check availability is in the bottom bar", async ({ page }) => {
  await page.goto("/");
  const panel = await openMenu(page);
  await expect(panel.getByRole("link")).toHaveText(["Rooms", "Contact"]);
  await expect(panel.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
  // One "Check availability" on screen: the bar's, not the header's or the menu's.
  await expect(page.getByRole("link", { name: "Check availability", exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(page.locator(".fj-bar-main")).toBeVisible();
  await expect(page.locator(".fj-nav-check")).toBeHidden();
  await expect(page.locator(".fj-nav-wa")).toBeHidden();
  await panel.getByRole("link", { name: "Rooms" }).click();
  await expect(page).toHaveURL(/\/rooms$/);
  await expect(page.locator("h1")).toHaveText("Rooms");
});

test("on /rooms the RW pill opens /rw/rooms and the menu marks Rooms", async ({ page }) => {
  await page.goto("/rooms");
  const panel = await openMenu(page);
  await expect(panel.getByRole("link", { name: "Rooms" })).toHaveAttribute("aria-current", "page");
  await page.locator('.fj-pills a[hreflang="rw"]').click();
  await expect(page).toHaveURL(/\/rw\/rooms$/);
});

test("language pills keep the page; logo links home", async ({ page }) => {
  await page.goto("/rw");
  await expect(page.locator(".fj-logo")).toHaveAttribute("href", "/rw");
  await expect(page.locator('.fj-pills a[hreflang="en"]')).toHaveAttribute("href", "/");
});

test("footer links Contact on every page", async ({ page }) => {
  for (const path of ["/", "/rooms", "/contact"]) {
    await page.goto(path);
    await expect(page.locator(".fj-footer").getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
  }
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });
  test("links are inline, there is no burger, and Check availability is the header button only", async ({ page }) => {
    for (const path of ["/", "/rooms", "/contact"]) {
      await page.goto(path);
      await expect(page.locator(".fj-menu summary"), path).toBeHidden();
      await expect(page.locator(".fj-nav-inline li a"), path).toHaveText(["Rooms", "Contact"]);
      await expect(page.locator(".fj-nav-check"), path).toBeVisible();
      await expect(page.locator(".fj-nav-check"), path).toHaveAttribute("href", "/book");
      await expect(page.locator(".fj-bar"), path).toBeHidden();
      await expect(page.getByRole("link", { name: "Check availability", exact: true }).filter({ visible: true }), path).toHaveCount(1);
    }
  });

  test("a compact WhatsApp button sits next to Check availability", async ({ page }) => {
    for (const path of ["/", "/rooms", "/contact", "/book"]) {
      await page.goto(path);
      const wa = page.locator(".fj-nav-wa");
      await expect(wa, path).toBeVisible();
      await expect(wa, path).toHaveAccessibleName("WhatsApp");
      await expect(wa, path).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+/);
      const [c, w] = [await page.locator(".fj-nav-check").boundingBox(), await wa.boundingBox()];
      expect(w!.x, path).toBeGreaterThan(c!.x + c!.width);
      expect(w!.x - (c!.x + c!.width), path).toBeLessThan(16);
      expect(w!.width, path).toBeLessThanOrEqual(40);
    }
  });

  test("room cards keep Check dates", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.locator("#room-volcano-view-double").getByRole("link", { name: "Check dates" })).toBeVisible();
  });

  test("the header stays at the top, solid and full width", async ({ page }) => {
    await page.goto("/rooms");
    await page.evaluate(() => window.scrollTo(0, 1500));
    const h = await header(page);
    expect(h.top).toBe(0);
    expect(solid(h.bg), h.bg).toBe(true);
    const box = (await page.locator(".fj-header").boundingBox())!;
    expect(box.width).toBe(1280);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the menu still opens", async ({ page }) => {
    await page.goto("/");
    const panel = await openMenu(page);
    await expect(panel.getByRole("link", { name: "Rooms" })).toBeVisible();
  });
});

test("the name links home; there is no Home link", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page.locator(".fj-logo")).toHaveAttribute("href", "/");
  await expect(page.locator(".fj-header").getByRole("link", { name: "Home", exact: true })).toHaveCount(0);
});

test("the header is sticky and solid on every page without a hero", async ({ page }) => {
  for (const path of ["/rooms", "/contact", "/book", "/privacy"]) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, 600));
    const h = await header(page);
    expect(h.top, path).toBe(0);
    expect(h.height, path).toBe(56);
    expect(solid(h.bg), `${path}: ${h.bg}`).toBe(true);
  }
});

test.describe("home with the pinned hero", () => {
  test.use({ reducedMotion: "no-preference" });
  test("the header sits on the hero while pinned, then sticks, solid, after the hero scrolls away", async ({ page }) => {
    await page.goto("/");
    let h = await header(page);
    expect(h.top).toBe(0);
    expect(solid(h.bg), `transparent over the pinned hero: ${h.bg}`).toBe(false);
    const pin = (await page.locator(".fj-hero-pin").boundingBox())!;
    await page.evaluate((y) => window.scrollTo(0, y), Math.ceil(pin.height) + 400);
    await expect.poll(async () => solid((await header(page)).bg)).toBe(true);
    h = await header(page);
    expect(h.top).toBe(0);
    await expect(page.locator(".fj-logo")).toBeInViewport();
  });
});

test.describe("small phone (360x640)", () => {
  test.use({ viewport: { width: 360, height: 640 } });
  test("sticky header and bottom bar leave most of the screen for content", async ({ page }) => {
    for (const path of ["/", "/rooms", "/contact", "/book"]) {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, 3000));
      const head = (await page.locator(".fj-header").boundingBox())!;
      const bar = (await page.locator(".fj-bar").boundingBox())!;
      expect(head.y, path).toBe(0);
      expect(Math.round(bar.y + bar.height), path).toBeLessThanOrEqual(640);
      const content = bar.y - (head.y + head.height);
      // At least 70% of the screen (448 of 640 px) stays content.
      expect(content, `${path}: ${content}px of content`).toBeGreaterThanOrEqual(448);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBe(0);
    }
  });
});
