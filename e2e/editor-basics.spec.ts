import { expect, test } from "@playwright/test";
import { liveLodge, noSideScroll, rest, signIn } from "./helpers/editor";

/** Editor part 1 (specs/editor-basics.md), local Supabase only. */
test.skip(!["127.0.0.1", "localhost"].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://invalid").hostname), "local Supabase only");

test("business info: the owner saves new contacts, the live site shows them at once, and the change is logged", async ({ page }) => {
  const lodge = await liveLodge();
  // The guest page is cached first, so the save has to refresh it.
  await page.goto(`/s/${lodge.slug}/contact`);
  await expect(page.locator("body")).toContainText("+250 700 000 001");

  await signIn(page, lodge.email);
  await page.locator(`[data-business="${lodge.id}"]`).getByRole("link", { name: "Edit your site" }).click();
  await expect(page.getByRole("heading", { name: "Edit your site" })).toBeVisible();
  await noSideScroll(page);
  await page.getByRole("link", { name: /Business info/ }).click();
  await noSideScroll(page);
  await page.getByLabel("Phone").fill("0788 123 456");
  await page.getByLabel("WhatsApp").fill("0788123457");
  await page.getByLabel("Google Maps link").fill("https://maps.app.goo.gl/kinigi");
  await page.locator('input[name="hours.1.en"]').fill("Restaurant: 7:00–22:00");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved. It is live on your site.");
  await expect(page.getByLabel("Phone")).toHaveValue("+250 788 123 456");

  await page.goto(`/s/${lodge.slug}/contact`);
  await expect(page.locator("body")).toContainText("+250 788 123 456");
  await expect(page.locator("body")).toContainText("Restaurant: 7:00–22:00");
  await expect(page.locator('a[href^="https://wa.me/250788123457"]').first()).toBeAttached();

  const log = await rest(`content_changes?business_id=eq.${lodge.id}&table_name=eq.site_settings&action=eq.update&select=actor_id,actor_kind,changes`);
  expect(log.some((r: { actor_id: string; actor_kind: string; changes: object }) => r.actor_id === lodge.ownerId && r.actor_kind === "owner" && "contacts" in r.changes)).toBe(true);
});

test("a bad number is refused with a clear message and nothing is saved", async ({ page }) => {
  const lodge = await liveLodge();
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/info`);
  await page.getByLabel("Phone").fill("12");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Check the phone number");
  const [s] = await rest(`site_settings?business_id=eq.${lodge.id}&select=contacts`);
  expect(s.contacts.phone).toBe("+250 700 000 001");
});

test("languages and translation markers: Missing, then Draft, then Checked", async ({ page }) => {
  const lodge = await liveLodge();
  await signIn(page, lodge.email);
  await page.goto(`/owner/b/${lodge.id}/edit/languages`);
  await page.locator('[data-lang="rw"] input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");

  await page.goto(`/owner/b/${lodge.id}/edit/info`);
  const area = page.locator('[data-field="location.area"]');
  await expect(area.locator('[data-marker="missing"]')).toHaveText("Missing RW");
  await area.locator('input[name="area.rw"]').fill("Kinigi, hafi ya pariki");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(area.locator('[data-marker="draft"]')).toBeVisible();
  await area.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(area.locator('[data-marker="checked"]')).toBeVisible();
  // Changing the text makes it a draft again.
  await area.locator('input[name="area.rw"]').fill("Kinigi");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(area.locator('[data-marker="draft"]')).toBeVisible();

});

test.describe("on a 2× phone", () => {
  test.use({ deviceScaleFactor: 2 });
  test("photo: a 4 MB camera JPEG is shrunk on the phone to WebP sizes without EXIF and shows as the hero", async ({ page }) => {
    const lodge = await liveLodge();
    await signIn(page, lodge.email);
    await page.goto(`/owner/b/${lodge.id}/edit/photos`);
    await expect(page.getByText("Don't upload photos of guests without their consent.")).toBeVisible();
    await noSideScroll(page);

    // A 4000×3000 JPEG made in the browser, with a fake EXIF block (with "GPS") put in after the start marker.
    const b64 = await page.evaluate(async () => {
      const c = document.createElement("canvas");
      c.width = 4000; c.height = 3000;
      const g = c.getContext("2d")!;
      const img = g.createImageData(4000, 3000);
      // Photo-like: smooth sky-to-hill gradients with a little sensor grain (pure noise would not compress at all).
      for (let p = 0, i = 0; p < 4000 * 3000; p++, i += 4) { const x = p % 4000, y = (p / 4000) | 0, n = Math.random() * 24; img.data[i] = 60 + y / 20 + n; img.data[i + 1] = 90 + x / 40 + n; img.data[i + 2] = 200 - y / 18 + n; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.95));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    });
    const jpeg = Buffer.from(b64, "base64");
    const exif = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 0x12]), Buffer.from("Exif\0\0GPSSECRET!")]);
    const original = Buffer.concat([jpeg.subarray(0, 2), exif, jpeg.subarray(2)]);
    expect(original.length).toBeGreaterThan(3_000_000);

    await page.getByLabel("Photo", { exact: true }).setInputFiles({ name: "camera.jpg", mimeType: "image/jpeg", buffer: original });
    await page.getByText("Top of the home page").click();
    await page.locator('input[name="alt.en"]').fill("The volcanoes from the terrace");
    await page.getByRole("button", { name: "Add photo" }).click();
    await expect(page).toHaveURL(/\/edit\/photos\/[0-9a-f-]{36}\?saved=1$/, { timeout: 30_000 });

    const [m] = await rest(`media?business_id=eq.${lodge.id}&select=storage_path,format,width,height,bytes,place`);
    expect(m).toMatchObject({ format: "webp", width: 1440, height: 1080, place: "hero" });
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/business-media/${m.storage_path}`;
    for (const w of [480, 960, 1440]) {
      const res = await fetch(`${base}/${w}.webp`);
      expect(res.status).toBe(200);
      const body = Buffer.from(await res.arrayBuffer());
      expect(body.length, `${w}`).toBeLessThanOrEqual(300 * 1024);
      expect(body.includes("GPSSECRET")).toBe(false);
    }

    await page.goto(`/s/${lodge.slug}`);
    const hero = page.locator(".fj-hero-img");
    await expect(hero).toHaveAttribute("srcset", new RegExp(`${m.storage_path}/960\\.webp 960w`));
    await expect(hero).toHaveAttribute("sizes", "100vw");
    // The phone (360 px wide, 2×) loads the 960 file.
    await expect.poll(() => hero.evaluate((i: HTMLImageElement) => i.currentSrc)).toContain("/960.webp");
  });
});

test("an owner of another business gets a plain 404 on this editor", async ({ page }) => {
  const [mine, theirs] = [await liveLodge(), await liveLodge()];
  await signIn(page, mine.email);
  const res = await page.goto(`/owner/b/${theirs.id}/edit/info`);
  expect(res?.status()).toBe(404);
  await expect(page.locator("body")).not.toContainText(theirs.name);
});
