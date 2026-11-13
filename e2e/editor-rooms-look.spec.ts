import { expect, test } from "@playwright/test";
import { liveLodge, noSideScroll, rest, signIn } from "./helpers/editor";

/** Editor part 2 (specs/editor-rooms-look.md), local Supabase only. */
test.skip(!["127.0.0.1", "localhost"].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://invalid").hostname), "local Supabase only");

test("rooms: add a room with both prices, it shows on /rooms in RWF and USD; reorder; a missing USD price is refused", async ({ page }) => {
  const lodge = await liveLodge();
  await page.goto(`/s/${lodge.slug}/rooms`); // cached before the save
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit`);
  await page.getByRole("link", { name: /Rooms/ }).click();
  await noSideScroll(page);
  await page.getByRole("link", { name: "+ Add room" }).click();
  await noSideScroll(page);
  await page.locator('input[name="name.en"]').fill("Volcano Suite");
  await page.getByLabel("RWF").fill("120000");
  await page.getByLabel("USD").fill("90");
  await page.locator('select[name="amenity.0.icon"]').selectOption("view");
  await page.locator('input[name="amenity.0.label.en"]').fill("Volcano view");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await expect(page).toHaveURL(/\/edit\/rooms\/[0-9a-f-]{36}\?saved=1$/);

  await page.goto(`/s/${lodge.slug}/rooms`);
  const suite = page.locator("#room-volcano-suite");
  await expect(suite).toContainText("Volcano Suite");
  await expect(suite.locator(".fj-cur-rwf").first()).toContainText("120,000");
  await expect(suite.locator(".fj-cur-usd").first()).toContainText("90");

  // Move the new room up: it becomes the first room.
  await page.goto(`/owner/b/${lodge.id}/edit/rooms`);
  await page.getByRole("button", { name: "Move up: Volcano Suite" }).click();
  await expect(page.locator("[data-room]").first()).toContainText("Volcano Suite");
  await page.goto(`/s/${lodge.slug}/rooms`);
  await expect(page.locator(".fj-room-block").first()).toHaveAttribute("id", "room-volcano-suite");

  // RWF only: refused, nothing saved.
  await page.goto(`/owner/b/${lodge.id}/edit/rooms/new`);
  await page.locator('input[name="name.en"]').fill("Half Priced");
  await page.getByLabel("RWF").fill("50000");
  // The browser already blocks an empty required field; remove that to test the server's own check.
  await page.locator("input[required]").evaluateAll((els) => els.forEach((e) => e.removeAttribute("required")));
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Type the price in USD");
  expect(await rest(`catalog_items?business_id=eq.${lodge.id}&handle=eq.half-priced&select=id`)).toEqual([]);
});

test("a room name without RW shows Missing RW in the form and on the hub", async ({ page }) => {
  const lodge = await liveLodge();
  await rest(`businesses?id=eq.${lodge.id}`, { method: "PATCH", body: JSON.stringify({ languages: ["en", "rw"] }) });
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/rooms`);
  await page.locator("[data-room] a").first().click();
  await expect(page.locator('[data-field="name"] [data-marker="missing"]')).toHaveText("Missing RW");
  await page.goto(`/owner/b/${lodge.id}/edit`);
  await expect(page.locator('[data-missing="rw"]')).toContainText("no RW yet");
});

test("sections: Find us moved to the top and Rooms switched off, the home page follows", async ({ page }) => {
  const lodge = await liveLodge();
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/sections`);
  await noSideScroll(page);
  // Saved order: hero, rooms, findUs, then the rest. Two moves up bring Find us to the top (each move saves).
  for (const index of [1, 0]) {
    await page.getByRole("button", { name: "Move up: Find us" }).click();
    await expect(page.locator("[data-section]").nth(index)).toHaveAttribute("data-section", "findUs");
  }
  await page.locator('[data-section="rooms"] input[type="checkbox"]').uncheck();
  // The moves already left "?saved=1" in the address, so wait for this save's own page load.
  await Promise.all([page.waitForEvent("framenavigated"), page.getByRole("button", { name: "Save" }).click()]);
  await expect(page.locator('[data-section="rooms"] input[type="checkbox"]')).not.toBeChecked();

  await page.goto(`/s/${lodge.slug}`);
  const findFirst = await page.evaluate(() => {
    const find = document.querySelector(".fj-find");
    const hero = document.querySelector(".fj-hero");
    return Boolean(find && hero && find.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(findFirst).toBe(true);
  await expect(page.locator("main")).not.toContainText("Garden room");
});

test("look: Clay and Night are applied on the guest pages", async ({ page }) => {
  const lodge = await liveLodge();
  await page.goto(`/s/${lodge.slug}`);
  await expect(page.locator(".fj")).not.toHaveAttribute("data-accent", /.+/);
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/look`);
  await noSideScroll(page);
  await page.getByText("Night", { exact: true }).click();
  await page.getByText("Clay", { exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  for (const path of ["", "/rooms", "/contact"]) {
    await page.goto(`/s/${lodge.slug}${path}`);
    const root = page.locator(".fj");
    await expect(root).toHaveAttribute("data-look", "night");
    await expect(root).toHaveAttribute("data-accent", "clay");
    // Forced night with the clay night shade, on a phone set to light mode.
    expect(await root.evaluate((el) => getComputedStyle(el).getPropertyValue("--accent").trim())).toBe("#e0a07c");
    expect(await root.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(30, 27, 23)");
  }
});
