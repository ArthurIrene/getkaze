import { expect, test } from "@playwright/test";
import { insert } from "./helpers/supabase";
import { adminAal2, liveLodge, noSideScroll, rest, signIn } from "./helpers/editor";

/** Change log view (specs/change-log-view.md), local Supabase only. */
test.skip(!["127.0.0.1", "localhost"].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://invalid").hostname), "local Supabase only");

test("the owner's price change shows as You · Rooms · the room · price, with the time", async ({ page }) => {
  const lodge = await liveLodge();
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/rooms`);
  await page.locator("[data-room] a").first().click();
  await page.getByLabel("RWF").fill("65000");
  await page.getByLabel("USD").fill("48");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");

  await page.goto(`/owner/b/${lodge.id}/edit`);
  await page.getByRole("link", { name: /Changes/ }).click();
  await noSideScroll(page);
  const row = page.locator('[data-change="change"][data-actor="you"]').first();
  await expect(row).toContainText("Rooms · Garden room · price");
  await expect(row).toContainText(/You · \d\d:\d\d/);
  await expect(page.locator("main")).not.toContainText("@");
});

test("support edits during a visit show as Support team; the admin's log shows every business with emails, and the owner sees the read", async ({ page, context }) => {
  const lodge = await liveLodge();
  const other = await liveLodge();
  const admin = await adminAal2(page);

  // Without a support session the editor is a 404 for the admin.
  expect((await page.goto(`/owner/b/${lodge.id}/edit/info`))?.status()).toBe(404);
  await insert("support_access", { business_id: lodge.id, admin_id: admin.userId, reason: "Fixing the opening hours" });
  await page.goto(`/owner/b/${lodge.id}/edit/info`);
  await expect(page.getByText("Support session: you are editing this site for the owner.")).toBeVisible();
  await page.locator('input[name="hours.0.en"]').fill("Reception: 6:00–23:00");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

  await page.goto("/admin");
  await page.getByRole("link", { name: "Change log" }).click();
  await expect(page.locator("main ol")).toContainText(lodge.name);
  await expect(page.locator("main ol")).toContainText(other.name);
  await page.getByLabel("Business").selectOption({ label: lodge.name });
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page.locator("main ol")).not.toContainText(other.name);
  // The admin's own edit reads "You (email)" on our side.
  const ourRow = page.locator('[data-change="change"]').filter({ hasText: "Business info" }).first();
  await expect(ourRow).toContainText("Business info · hours");
  await expect(ourRow).not.toContainText("map");
  await expect(ourRow).toContainText(admin.email);

  // The owner sees our edit, the visit and that we read the log; never our email.
  await context.clearCookies();
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/changes`);
  await expect(page.locator('[data-change="change"][data-actor="support"]').first()).toContainText("Support team");
  await expect(page.locator('[data-change="support_start"]')).toContainText("Fixing the opening hours");
  await expect(page.locator('[data-change="log_read"]').first()).toContainText("Support read this change log");
  await expect(page.locator("main")).not.toContainText(admin.email);
  const reads = await rest(`support_access?business_id=eq.${lodge.id}&kind=eq.log_read&select=id`);
  expect(reads.length).toBeGreaterThanOrEqual(1);
});
