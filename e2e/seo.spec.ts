import { expect, test } from "@playwright/test";

/** SEO basics (specs/seo-basics.md). noindex stays on every page until G2 (D-054). */
const pages = ["/", "/rw", "/rooms", "/rw/rooms", "/contact", "/rw/contact", "/book", "/rw/book", "/privacy", "/rw/privacy"];
/** The demo's own address (siteBaseUrl): the /s/<slug> fallback until PLATFORM_DOMAIN is set (business-by-host.md). */
const base = "https://getkaze.vercel.app/s/kinigi-hills";
const hostRoot = "https://getkaze.vercel.app";
/** Next writes the home URL without its trailing slash; both forms are the same address. */
const norm = (url: string | null) => (url ? new URL(url).href : url);

test("every page has a unique title, a short description, a canonical, alternates, Open Graph and noindex", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of pages) {
    const res = await page.goto(path);
    expect(res?.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute("content", "noindex, nofollow");

    const title = await page.title();
    expect(titles.has(title), `${path}: ${title}`).toBe(false);
    titles.add(title);

    const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(description.length, path).toBeGreaterThan(20);
    expect(description.length, path).toBeLessThanOrEqual(160);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(norm(canonical), path).toBe(norm(`${base}${path}`));
    const english = path.replace(/^\/rw(?=\/|$)/, "") || "/";
    const alt = async (lang: string) => norm(await page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute("href"));
    expect(await alt("en"), path).toBe(norm(`${base}${english}`));
    expect(await alt("rw"), path).toBe(norm(`${base}${english === "/" ? "/rw" : `/rw${english}`}`));
    expect(await alt("x-default"), path).toBe(norm(`${base}${english}`));

    await expect(page.locator('meta[property="og:title"]'), path).toHaveAttribute("content", title);
    expect(norm(await page.locator('meta[property="og:url"]').getAttribute("content")), path).toBe(norm(canonical));
    await expect(page.locator('meta[property="og:type"]'), path).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:locale"]'), path).toHaveAttribute("content", path.startsWith("/rw") ? "rw_RW" : "en_US");
  }
  expect(titles.has("Kinigi Hills | Lodge in Kinigi, Musanze")).toBe(true);
  expect(titles.has("Rooms | Kinigi Hills")).toBe(true);
});

test("home page structured data describes the lodge", async ({ page }) => {
  await page.goto("/");
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(json ?? "{}");
  expect(data["@type"]).toBe("LodgingBusiness");
  expect(data.name).toBe("Kinigi Hills");
  expect(data.telephone).toBe("+250 700 000 000");
  expect(data.address).toMatchObject({ addressLocality: "Kinigi", addressRegion: "Musanze", addressCountry: "RW" });
  expect(data.containsPlace).toHaveLength(4);
  expect(data.priceRange).toBe("USD 35–75");
});

test("sitemap lists every page in both languages; robots allows all and points to it", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of pages) expect(xml, path).toContain(`<loc>${base}${path}</loc>`);
  expect(xml).toContain('hreflang="rw"');
  expect(xml).not.toContain("/book/send");
  expect(xml).not.toContain("/book/error");

  const robots = await request.get("/robots.txt");
  const text = await robots.text();
  expect(text).toContain("Allow: /");
  expect(text).not.toMatch(/Disallow/i);
  expect(text).toContain(`Sitemap: ${hostRoot}/sitemap.xml`);
  expect(robots.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});
