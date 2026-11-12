import { expect, test } from "@playwright/test";

/** Happy path on a 360x800 phone: home, language link, currency switch, booking request link. */
test("home happy path: RW link, RWF/USD switch, Check availability opens the request form", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1").first()).toBeVisible();

  // RWF/USD switch: the demo starts on USD; picking RWF swaps the visible price.
  const firstRoom = page.locator(".fj-cur-usd").first().locator("..");
  const usd = firstRoom.locator(".fj-cur-usd");
  const rwf = firstRoom.locator(".fj-cur-rwf");
  await usd.scrollIntoViewIfNeeded();
  await expect(usd).toBeVisible();
  await expect(rwf).toBeHidden();
  const usdText = (await usd.textContent())?.trim();
  expect(usdText).toMatch(/^USD /);
  await page.locator('label[for="fj-cur-rwf"]').click();
  await expect(rwf).toBeVisible();
  await expect(usd).toBeHidden();
  const rwfText = (await rwf.textContent())?.trim();
  expect(rwfText).toMatch(/^RWF /);
  expect(rwfText).not.toBe(usdText);

  // "Check availability" opens the request form (D-044); e2e/book.spec.ts follows it to WhatsApp.
  const check = page.locator(".fj-bar").getByRole("link", { name: "Check availability" });
  await expect(check).toBeVisible();
  await expect(check).toHaveAttribute("href", "/book");

  // The RW link goes to /rw.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('a[hreflang="rw"]').first().click();
  await expect(page).toHaveURL(/\/rw\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "rw");
});
