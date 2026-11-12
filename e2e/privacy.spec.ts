import { expect, test } from "@playwright/test";

/** Privacy notice (specs/privacy-notice.md; draft, pending lawyer review). */
test("footer Privacy link opens the notice, filled from the business data, marked as a draft", async ({ page }) => {
  await page.goto("/rooms");
  await page.locator(".fj-footer").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator("h1")).toHaveText("Privacy notice");
  await expect(page.locator(".fj-draft")).toHaveText("Draft, pending legal review");
  const body = page.locator(".fj-legal");
  await expect(body).toContainText("Kinigi Hills Lodge (demo)");
  await expect(body).toContainText("email hello@example.com");
  await expect(body).toContainText("Altavision (GetKaze)");
  await expect(body).toContainText("sets no cookies");
  await expect(body).toContainText("Law No. 058/2021");
});

test("Kinyarwanda notice: headings in Kinyarwanda, body falls back to English", async ({ page }) => {
  await page.goto("/rw/privacy");
  await expect(page.locator("h1")).toHaveText("Itangazo ryerekeye ubuzima bwite");
  await expect(page.getByRole("heading", { name: "Uburenganzira bwawe" })).toBeVisible();
  await expect(page.locator(".fj-legal")).toContainText("Law No. 058/2021");
  await expect(page.locator(".fj-legal")).not.toContainText("Privacy.");
});

test("no guest page sets a cookie", async ({ request }) => {
  for (const path of ["/", "/rw", "/rooms", "/contact", "/book", "/privacy", "/rw/privacy"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie"), path).toEqual([]);
  }
});

test("every page links Privacy in the footer", async ({ page }) => {
  for (const path of ["/", "/rooms", "/contact", "/book"]) {
    await page.goto(path);
    await expect(page.locator(".fj-footer").getByRole("link", { name: "Privacy" }), path).toHaveAttribute("href", "/privacy");
  }
});
