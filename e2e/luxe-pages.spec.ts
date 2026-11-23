import { expect, test } from "@playwright/test";

/** The Luxe demo business is served through the /s/<slug> fallback path. */
const LUXE = "/s/luxe-musanze";

/** The Field Journal demo business (kinigi-hills) is NOT Luxe. */
const KINIGI = "/s/kinigi-hills";

/** Page ids Luxe builds (mirrors templates/luxe/pages.ts). */
const built = ["", "/rooms", "/contact", "/book", "/privacy", "/experiences", "/dining", "/gallery"];

/** Page ids Luxe does not build (must return a clean 404). */
const notBuilt = ["/credits", "/not-a-page"];

/** Luxe-only routes that must return 404 (never 500) on a non-Luxe site. */
const luxeOnlyRoutes = ["/my-stay", "/experiences", "/dining", "/gallery"];

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

test("Luxe experiences page renders activity cards", async ({ page }) => {
  const res = await page.goto(`${LUXE}/experiences`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-activity-card").first()).toBeVisible();
});

test("Luxe privacy page renders the notice", async ({ page }) => {
  const res = await page.goto(`${LUXE}/privacy`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-legal")).toBeVisible();
});

test("Luxe gallery page renders gallery photos", async ({ page }) => {
  const res = await page.goto(`${LUXE}/gallery`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-gallery")).toBeVisible();
  await expect(page.locator(".tl-gallery-item")).toHaveCount(3);
  await expect(page.locator(".tl-gallery-page")).toHaveText("Page 1 of 2");
});

test("Luxe gallery page 2 renders remaining photos", async ({ page }) => {
  const res = await page.goto(`${LUXE}/gallery?page=2`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-gallery-item")).toHaveCount(2);
  await expect(page.locator(".tl-gallery-page")).toHaveText("Page 2 of 2");
});

test("Luxe gallery out-of-range page clamps to last page", async ({ page }) => {
  const res = await page.goto(`${LUXE}/gallery?page=99`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-gallery-page")).toHaveText("Page 2 of 2");
});

test("rw gallery page renders Kinyarwanda", async ({ page }) => {
  const res = await page.goto(`${LUXE}/rw/gallery`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".tl-gallery")).toBeVisible();
  await expect(page.locator(".tl-gallery-page")).toHaveText("Pejji 1 ku 2");
});

test("Luxe pages not built return 404", async ({ page }) => {
  for (const path of notBuilt) {
    const res = await page.goto(`${LUXE}${path}`);
    expect(res?.status()).toBe(404);
  }
});

test("Luxe-only routes return 404 (never 500) on non-Luxe Kinigi site", async ({ page }) => {
  for (const path of luxeOnlyRoutes) {
    const res = await page.goto(`${KINIGI}${path}`);
    expect(res?.status()).toBe(404);
  }
});

test("POST /my-stay/send returns 404 on non-Luxe Kinigi site", async ({ page }) => {
  const res = await page.request.post(`${KINIGI}/my-stay/send`, {
    form: { item: "", group: "room", checkIn: "2026-12-01", checkOut: "2026-12-03", name: "Test" },
  });
  expect(res.status()).toBe(404);
});

test("POST /my-stay/send with missing fields returns 400 on Luxe site", async ({ page }) => {
  const res = await page.request.post(`${LUXE}/my-stay/send`, {
    form: { item: "", group: "room", checkIn: "", checkOut: "", name: "" },
  });
  expect(res.status()).toBe(400);
});

test("POST /my-stay/send with check-out before check-in returns 400 on Luxe site", async ({ page }) => {
  const res = await page.request.post(`${LUXE}/my-stay/send`, {
    form: { item: "101", group: "room", checkIn: "2026-12-05", checkOut: "2026-12-03", name: "Test" },
  });
  expect(res.status()).toBe(400);
});

test("POST /my-stay/send with valid data redirects on Luxe site", async ({ page }) => {
  const res = await page.request.post(`${LUXE}/my-stay/send`, {
    form: { item: "101", group: "room", checkIn: "2026-12-01", checkOut: "2026-12-03", name: "Test User" },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
});
