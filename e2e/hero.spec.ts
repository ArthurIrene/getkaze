import { expect, test, type Page } from "@playwright/test";

/**
 * Hero checks on a 360x800 phone.
 *
 * The hero starts full screen, stays pinned while it shrinks to the card, then
 * scrolls away. These tests look at real pixels, because the shrink is drawn by
 * translated layers and paper edges, not by the element's box. They guard the
 * minifier quirk that turned a name-less "animation: linear both" into
 * "animation: none" (the hero then stays full screen).
 */

const PAPER: Rgb = [0xf4, 0xee, 0xe3]; // --paper, light scheme
type Rgb = [number, number, number];

async function pixels(page: Page, points: Array<[number, number]>): Promise<Rgb[]> {
  const png = await page.screenshot({ animations: "allow", scale: "css" });
  const decoder = await page.context().newPage();
  try {
    return await decoder.evaluate(
      async ({ data, points }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${data}`;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        return points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)) as [number, number, number]);
      },
      { data: png.toString("base64"), points },
    );
  } finally {
    await decoder.close();
  }
}

const isPaper = (c: Rgb) => c.every((v, i) => Math.abs(v - PAPER[i]) <= 3);

/** Assert the hero is drawn as the card: 16 px paper margins, card bottom at the hero box bottom. */
async function expectCard(page: Page) {
  const box = await page.locator(".fj-hero").boundingBox();
  expect(box).not.toBeNull();
  const bottom = Math.round(box!.y + box!.height);
  const row = bottom - 120; // inside the card, above the stamp
  expect(row).toBeGreaterThan(80);
  expect(row).toBeLessThan(700);
  const [m1, in1, in2, m2, below] = await pixels(page, [
    [4, row], // left margin
    [28, row], // just inside the left edge
    [332, row], // just inside the right edge
    [356, row], // right margin
    [60, bottom + 10], // under the card
  ]);
  expect(isPaper(m1), `left margin is paper: ${m1}`).toBe(true);
  expect(isPaper(m2), `right margin is paper: ${m2}`).toBe(true);
  expect(isPaper(in1), `card starts by x=28: ${in1}`).toBe(false);
  expect(isPaper(in2), `card reaches x=332: ${in2}`).toBe(false);
  expect(isPaper(below), `card ends at its box bottom: ${below}`).toBe(true);
}

test.describe("hero with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("full screen at the top, still card-sized after scrolling past the pin", async ({ page }) => {
    await page.goto("/");
    const pin = page.locator(".fj-hero-pin");

    // The pinned version is active: the wrapper is taller than the card and the layers animate.
    const pinHeight = (await pin.boundingBox())!.height;
    expect(pinHeight).toBeGreaterThan(56 + 440);
    const anim = await page.locator(".fj-hero-bg").evaluate((el) => {
      const s = getComputedStyle(el);
      return { name: s.animationName, fill: s.animationFillMode, timing: s.animationTimingFunction };
    });
    expect(anim, "the minifier must keep the animation longhands").toEqual({ name: "fj-hero-bg", fill: "both", timing: "linear" });

    // At the top it is full screen: no paper margin at the sides.
    const [edge] = await pixels(page, [[4, 400]]);
    expect(isPaper(edge), `full screen at the top: ${edge}`).toBe(false);

    // Scroll past the pin (shrink distance 60svh = 480 px here).
    const shrink = pinHeight - (56 + 440);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(shrink + 80));
    await page.waitForTimeout(300);
    await expectCard(page);
  });
});

test.describe("hero with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("renders as the plain card", async ({ page }) => {
    await page.goto("/");
    const box = (await page.locator(".fj-hero").boundingBox())!;
    expect(box.x).toBe(16);
    expect(box.width).toBe(360 - 32);
    expect(box.height).toBe(440);
    const pinHeight = (await page.locator(".fj-hero-pin").boundingBox())!.height;
    expect(pinHeight).toBe(440);
    const names = await page.locator(".fj-hero-bg").evaluate((el) => getComputedStyle(el).animationName);
    expect(names).toBe("none");
    await expectCard(page);
  });
});
