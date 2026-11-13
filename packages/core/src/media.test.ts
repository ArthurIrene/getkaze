import { describe, expect, it } from "vitest";
import { mediaBusiness, mediaFile, mediaFolder, photoFiles, photoLimits, photoProblems, publicMediaUrl } from "./media";

const A = "00000000-0000-0000-0000-00000000000a";
const P = "00000000-0000-0000-0000-0000000000f2";
const webpHead = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const jpegHead = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const pngHead = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("photo names", () => {
  it("builds folder and file names that the database accepts", () => {
    const folder = mediaFolder(A, P);
    expect(folder).toBe(`${A}/${P}`);
    expect(mediaFile(folder, 960, "image/webp")).toBe(`${A}/${P}/960.webp`);
    expect(mediaBusiness(mediaFile(folder, 1440, "image/jpeg"))).toBe(A);
  });
  it("refuses anything else", () => {
    expect(() => mediaFolder("A", P)).toThrow();
    expect(() => mediaFolder(A.toUpperCase(), P)).toThrow();
    for (const n of [`${A}/x.webp`, `${A}/${P}/500.webp`, `${A}/${P}/480.png`, `${A}/../${P}/480.webp`, `x/${A}/${P}/480.webp`])
      expect(mediaBusiness(n), n).toBeNull();
  });
  it("lists every possible file of a photo", () => {
    expect(photoFiles(`${A}/${P}`)).toHaveLength(6);
  });
});

describe("photoProblems", () => {
  it("accepts a small WebP or JPEG of the right width", () => {
    expect(photoProblems({ type: "image/webp", bytes: 80_000, width: 960, head: webpHead }, 960)).toEqual([]);
    expect(photoProblems({ type: "image/jpeg", bytes: 30_000, width: 480, head: jpegHead }, 480)).toEqual([]);
  });
  it("names each problem", () => {
    expect(photoProblems({ type: "image/png", bytes: 1, width: 480, head: pngHead }, 480)).toEqual(["type", "content"]);
    expect(photoProblems({ type: "image/webp", bytes: 0, width: 480, head: webpHead }, 480)).toEqual(["empty"]);
    expect(photoProblems({ type: "image/webp", bytes: photoLimits.fileBytes + 1, width: 2000, head: webpHead }, 1440)).toEqual(["tooLarge", "width"]);
    // A PNG (or a script) renamed to .webp is refused by its bytes.
    expect(photoProblems({ type: "image/webp", bytes: 10, width: 480, head: pngHead }, 480)).toEqual(["content"]);
  });
});

describe("publicMediaUrl", () => {
  it("builds the public URL", () => {
    expect(publicMediaUrl(`${A}/${P}/480.webp`, "http://127.0.0.1:25321/")).toBe(`http://127.0.0.1:25321/storage/v1/object/public/business-media/${A}/${P}/480.webp`);
  });
});

describe("static demo photos and credits", () => {
  it("builds the same srcset as uploads, from the app's own folder", async () => {
    const { staticPhotoUrls, licenceLabel, needsAttribution } = await import("./media");
    expect(staticPhotoUrls("demo-photos/hero-volcanoes", "webp", 1440)).toEqual({
      src: "/demo-photos/hero-volcanoes/1440.webp",
      srcset: "/demo-photos/hero-volcanoes/480.webp 480w, /demo-photos/hero-volcanoes/960.webp 960w, /demo-photos/hero-volcanoes/1440.webp 1440w",
    });
    expect(staticPhotoUrls("demo-photos/x", "webp", 960).srcset).toBe("/demo-photos/x/480.webp 480w, /demo-photos/x/960.webp 960w");
    expect(() => staticPhotoUrls("../etc", "webp", 960)).toThrow();
    expect(licenceLabel("cc-by-4.0")).toBe("CC BY 4.0");
    expect(licenceLabel("cc0")).toBe("CC0 1.0");
    expect(needsAttribution("cc-by-2.0")).toBe(true);
    expect(needsAttribution("cc0")).toBe(false);
  });
});
