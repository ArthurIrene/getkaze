import { expect, test } from "@playwright/test";

/** Rooms page happy path on a 360x800 phone (specs/rooms-page.md). */
test("home room card opens the rooms page at that room; currency, More + and Check dates work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "All rooms →" })).toHaveAttribute("href", "/rooms");
  const card = page.locator('.fj-room-link[href="/rooms#room-volcano-view-double"]');
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page).toHaveURL(/\/rooms#room-volcano-view-double$/);
  const block = page.locator("#room-volcano-view-double");
  await expect(block.locator("h2")).toHaveText("Volcano View Double");
  await expect(block).toBeInViewport();

  // Prices follow the CSS-only switch (demo default USD).
  const price = block.locator(".fj-room-price");
  await expect(price.locator(".fj-cur-usd")).toHaveText("USD 60");
  await page.locator('label[for="fj-cur-rwf"]').click();
  await expect(price.locator(".fj-cur-rwf")).toHaveText("RWF 80,000");
  await expect(price.locator(".fj-cur-usd")).toBeHidden();

  // More + shows the room's line and capacity; the label turns into Less −.
  const line = block.locator(".fj-room-more");
  await expect(line).toBeHidden();
  await block.locator(".fj-more summary").click();
  await expect(line).toContainText("private balcony");
  await expect(line).toContainText("Sleeps 2");
  await expect(block.locator(".fj-more-close")).toBeVisible();
  await expect(block.locator(".fj-more-close")).toHaveText("Less −");
  await expect(block.locator(".fj-more-open")).toBeHidden();

  // Amenities are listed.
  await expect(block.locator(".fj-amen li")).toHaveCount(4);

  // Check dates: the request form with this room, or WhatsApp until the form exists.
  const href = await block.getByRole("link", { name: "Check dates" }).getAttribute("href");
  expect(href).toMatch(/^\/book\?room=volcano-view-double$|^https:\/\/wa\.me\//);
});

test("Kinyarwanda rooms page uses wording in Kinyarwanda and English owner fallback", async ({ page }) => {
  await page.goto("/rw/rooms");
  await expect(page.locator("html")).toHaveAttribute("lang", "rw");
  await expect(page.locator("h1")).toHaveText("Ibyumba");
  await expect(page.locator("#room-garden-single h2")).toHaveText("Garden Single");
  await expect(page.locator(".fj-stay summary")).toHaveText("Kwinjira, abana no kwishyura");
  await page.locator(".fj-stay summary").click();
  await expect(page.locator(".fj-stay")).toContainText("Kwinjira guhera 14:00");
});
