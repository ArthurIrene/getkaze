import { expect, test } from "@playwright/test";

/** PWA manifest per business (specs/pwa-manifest.md). No service worker in Batch 1. */

function pngSize(buffer: Buffer): { width: number; height: number } {
  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("head links the manifest, icons and theme colours", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/icons/icon.svg");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/icons/apple-180.png");
  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')).toHaveAttribute("content", "#f4eee3");
  await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute("content", "#1e1b17");
  expect(await page.evaluate(() => navigator.serviceWorker?.getRegistrations().then((r) => r.length) ?? 0)).toBe(0);
});

test("manifest has the business name, colours and icons of the stated sizes", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m).toMatchObject({
    name: "Kinigi Hills",
    short_name: "Kinigi Hills",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4eee3",
    theme_color: "#f4eee3",
  });
  expect(m.description.length).toBeGreaterThan(20);
  for (const icon of m.icons as { src: string; sizes: string; type: string; purpose: string }[]) {
    const file = await request.get(icon.src);
    expect(file.status(), icon.src).toBe(200);
    expect(file.headers()["content-type"], icon.src).toBe(icon.type);
    if (icon.type === "image/png") {
      const [w, h] = icon.sizes.split("x").map(Number);
      expect(pngSize(await file.body()), icon.src).toEqual({ width: w, height: h });
    }
  }
  expect((m.icons as { purpose: string }[]).some((i) => i.purpose === "maskable")).toBe(true);
  const svg = await (await request.get("/icons/icon.svg")).text();
  expect(svg).toContain(">KH</text>");
  expect(pngSize(await (await request.get("/icons/apple-180.png")).body())).toEqual({ width: 180, height: 180 });
});

test("first view loads no favicon.ico", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(new URL(r.url()).pathname));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(urls).not.toContain("/favicon.ico");
});
