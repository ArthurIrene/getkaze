import { expect, test } from "@playwright/test";

/**
 * Business by host (specs/business-by-host.md, D-062).
 * The second test server runs with PLATFORM_DOMAIN=altavision.test; Chromium
 * resolves *.altavision.test to this machine, so real subdomains are tested.
 */
// Resolve *.altavision.test to this machine for the subdomain tests (file-wide: it needs its own browser).
test.use({ launchOptions: { args: ["--host-resolver-rules=MAP *.altavision.test 127.0.0.1, MAP altavision.test 127.0.0.1"] } });

const sub = (host: string, path = "/") => `http://${host}:${process.env.E2E_SUBDOMAIN_PORT ?? 3201}${path}`;

test.describe("fallback path and demo (no platform domain yet)", () => {
  test("/s/<slug>/rooms shows the site and every link keeps the prefix", async ({ page }) => {
    const res = await page.goto("/s/kinigi-hills/rooms");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Rooms");
    await expect(page.locator(".fj-logo")).toHaveAttribute("href", "/s/kinigi-hills");
    await expect(page.locator('.fj-pills a[hreflang="rw"]')).toHaveAttribute("href", "/s/kinigi-hills/rw/rooms");
    await expect(page.locator(".fj-footer").getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/s/kinigi-hills/privacy");
    await expect(page.locator("#room-garden-double").getByRole("link", { name: "Check dates" })).toHaveAttribute("href", "/s/kinigi-hills/book?room=garden-double");
    await expect(page.locator(".fj-bar-main")).toHaveAttribute("href", "/s/kinigi-hills/book");
    const links = await page.locator("main a[href^='/'], header a[href^='/'], footer a[href^='/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
    expect(links.length).toBeGreaterThan(5);
    for (const href of links) expect(href, href).toMatch(/^\/s\/kinigi-hills(\/|$|#|\?)/);
  });

  test("the booking form on the fallback posts and errors within the prefix", async ({ page }) => {
    await page.goto("/s/kinigi-hills/rw/book?room=garden-single");
    await expect(page.locator("form#fj-book")).toHaveAttribute("action", "/s/kinigi-hills/rw/book/send");
    await page.locator('input[name="checkIn"]').fill("2099-01-01");
    await page.locator('input[name="checkOut"]').fill("2099-01-02");
    await page.locator('input[name="name"]').fill("Test");
    await page.evaluate(() => (document.querySelector("form#fj-book") as HTMLFormElement).noValidate = true);
    await page.getByRole("button", { name: "Ohereza kuri WhatsApp" }).click();
    await expect(page).toHaveURL(/\/s\/kinigi-hills\/rw\/book\/error\?reason=dates$/);
  });

  test("the bare host shows the demo; unknown slugs and the internal route are a clean 404", async ({ page }) => {
    expect((await page.goto("/"))?.status()).toBe(200);
    await expect(page.locator(".fj-logo")).toHaveText("Kinigi Hills");
    for (const path of ["/s/no-such-lodge", "/s/no-such-lodge/rooms", "/s/admin", "/site/kinigi-hills", "/en/site/kinigi-hills/rooms", "/rw/site/kinigi-hills"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
      await expect(page.getByRole("heading", { name: "This site is not available" }), path).toBeVisible();
      await expect(page.locator(".fj"), path).toHaveCount(0);
      expect(res?.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
    }
  });
});

test.describe("subdomains (PLATFORM_DOMAIN=altavision.test)", () => {
  test("<slug>.<domain> shows that business, in Kinyarwanda too, with links without /s/", async ({ page }) => {
    const res = await page.goto(sub("kinigi-hills.altavision.test", "/rw/contact"));
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "rw");
    await expect(page.locator("h1")).toHaveText("Twandikire");
    await expect(page.locator(".fj-logo")).toHaveAttribute("href", "/rw");
    await expect(page.locator(".fj-footer").getByRole("link", { name: "Ubuzima bwite" })).toHaveAttribute("href", "/rw/privacy");
    // The canonical address is fixed at build time (static pages), so this server, which reuses a build
    // made without PLATFORM_DOMAIN, still shows the fallback address. siteBaseUrl is unit-tested for both.
  });

  test("unknown and reserved subdomains, unknown hosts and our screens on a business host are 404", async ({ page }) => {
    for (const url of [
      sub("no-such-lodge.altavision.test"),
      sub("admin.altavision.test"),
      sub("a.b.altavision.test"),
      sub("kinigi-hills.altavision.test", "/login"),
      sub("kinigi-hills.altavision.test", "/admin"),
    ]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
      await expect(page.getByRole("heading", { name: "This site is not available" }), url).toBeVisible();
    }
  });

  test("our screens answer on the app host", async ({ page }) => {
    const res = await page.goto(sub("kaze.altavision.test", "/login"));
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect((await page.goto(sub("kaze.altavision.test", "/rooms")))?.status()).toBe(404);
  });
});
