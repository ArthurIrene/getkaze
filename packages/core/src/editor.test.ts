import { describe, expect, it } from "vitest";
import {
  canEditSite, editorProgress, infoTexts, languageProgress, mapUrlFromCoords, nextChecks, normalizePhone, parseBusinessInfo,
  parseLanguages, parsePhotoDetails, photoSrcset, safeMapUrl, siteCacheTags, translationState, widthsFor,
} from "./editor";

const form = (o: Record<string, string>) => (k: string) => o[k];
const noAdmin = { isPlatformAdmin: false, aal: "aal1" as const, openSupport: false };

describe("canEditSite", () => {
  it("lets an active owner in", () => expect(canEditSite({ roles: ["owner"], status: "active" }, noAdmin)).toEqual({ ok: true, as: "owner" }));
  it("refuses managers, disabled owners and strangers", () => {
    expect(canEditSite({ roles: ["manager"], status: "active" }, noAdmin).ok).toBe(false);
    expect(canEditSite({ roles: ["owner"], status: "disabled" }, noAdmin).ok).toBe(false);
    expect(canEditSite(null, noAdmin).ok).toBe(false);
  });
  it("admins need aal2 and an open support session", () => {
    expect(canEditSite(null, { isPlatformAdmin: true, aal: "aal1", openSupport: true }).ok).toBe(false);
    expect(canEditSite(null, { isPlatformAdmin: true, aal: "aal2", openSupport: false }).ok).toBe(false);
    expect(canEditSite(null, { isPlatformAdmin: true, aal: "aal2", openSupport: true })).toEqual({ ok: true, as: "support" });
  });
});

describe("normalizePhone", () => {
  it("writes Rwanda numbers one way", () => {
    for (const s of ["0788 123 456", "788123456", "250788123456", "+250 788-123-456"]) expect(normalizePhone(s), s).toBe("+250 788 123 456");
  });
  it("keeps other international numbers, refuses junk", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    for (const s of ["", "12", "abc", "+250 12", "0788 12"]) expect(normalizePhone(s), s).toBeNull();
  });
});

describe("map links", () => {
  it("accepts Google Maps links only, over https", () => {
    expect(safeMapUrl("https://maps.app.goo.gl/abc")).toBe("https://maps.app.goo.gl/abc");
    expect(safeMapUrl("https://www.google.com/maps/place/x")).toContain("google.com");
    for (const s of ["http://maps.google.com", "javascript:alert(1)", "https://evil.example/maps", "https://google.com.evil.io", "https://user@evil.io/x", "https://google.com:8080/x", "https://google.com?x"]) expect(safeMapUrl(s), s).toBeNull();
  });
  it("builds a pin link", () => expect(mapUrlFromCoords(-1.4995, 29.6344)).toBe("https://www.google.com/maps/search/?api=1&query=-1.499500,29.634400"));
});

describe("parseBusinessInfo", () => {
  const good = { name: " Kinigi  Hills ", phone: "0788123456", whatsapp: "+250788123457", email: "Hello@Lodge.rw", map_url: "", lat: "-1.5", lng: "29.6",
    "area.en": "Kinigi", "area.rw": "Kinigi (RW)", "area.fr": "ignored", "hours.0.en": "Reception: 24 hours", "hours.1.en": "", "directions.0.en": "Turn left" };
  it("cleans and fills the values", () => {
    const r = parseBusinessInfo(form(good), ["en", "rw"]);
    expect(r.ok && r.value).toEqual({
      name: "Kinigi Hills",
      contacts: { phone: "+250 788 123 456", whatsapp: "+250 788 123 457", email: "hello@lodge.rw" },
      location: { map_url: mapUrlFromCoords(-1.5, 29.6), lat: -1.5, lng: 29.6, area: { en: "Kinigi", rw: "Kinigi (RW)" }, directions: [{ en: "Turn left" }] },
      hours: [{ en: "Reception: 24 hours" }],
    });
  });
  it("names each problem", () => {
    const r = parseBusinessInfo(form({ name: "", phone: "1", whatsapp: "", email: "x@", map_url: "javascript:x", lat: "200", lng: "1" }), ["en"]);
    expect(!r.ok && r.problems).toEqual(["name", "phone", "whatsapp", "email", "coords", "map"]);
  });
});

describe("languages and translation marks", () => {
  it("English is always on", () => expect(parseLanguages(form({ "lang.fr": "on", "lang.en": "" }))).toEqual(["en", "fr"]));
  it("missing, draft, checked", () => {
    const checks = { "location.area": ["rw" as const] };
    expect(translationState({ en: "A" }, "rw", checks, "location.area")).toBe("missing");
    expect(translationState({ en: "A", rw: "B" }, "rw", {}, "location.area")).toBe("draft");
    expect(translationState({ en: "A", rw: "B" }, "rw", checks, "location.area")).toBe("checked");
  });
  it("a changed text loses its mark; a tick adds one", () => {
    const before = { a: { en: "A", rw: "old" }, b: { en: "B", rw: "same" } };
    const after = { a: { en: "A", rw: "new" }, b: { en: "B", rw: "same" }, c: { en: "C", fr: "Ç" } };
    const checks = { a: ["rw" as const], b: ["rw" as const] };
    expect(nextChecks(before, after, checks, form({ "check.c.fr": "on" }))).toEqual({ b: ["rw"], c: ["fr"] });
  });
  it("counts progress per language", () => {
    const texts = infoTexts({ location: { map_url: "x", area: { en: "A", rw: "a" }, directions: [{ en: "D" }] }, hours: [{ en: "H", rw: "h" }] });
    expect(languageProgress(texts, "rw")).toEqual({ done: 2, total: 3 });
  });
});

describe("hub progress", () => {
  it("rows and percent", () => {
    const p = editorProgress({ hasContacts: true, hasMap: true, hasHours: true, photos: 1, hasHeroPhoto: true, rooms: 2 });
    expect(p).toEqual({ done: { info: true, photos: false, rooms: true }, percent: 67 });
    expect(editorProgress({ hasContacts: true, hasMap: true, hasHours: false, photos: 3, hasHeroPhoto: true, rooms: null }).percent).toBe(50);
  });
});

describe("photos", () => {
  it("details need a place and English alt text; room photos a room", () => {
    expect(parsePhotoDetails(form({ place: "hero", "alt.en": "The view" }), ["en"])).toEqual({ ok: true, value: { place: "hero", itemId: null, alt: { en: "The view" } } });
    const r = parsePhotoDetails(form({ place: "room", item: "x" }), ["en"]);
    expect(!r.ok && r.problems).toEqual(["alt", "room"]);
    expect(parsePhotoDetails(form({ place: "dish", "alt.en": "x" }), ["en"]).ok).toBe(false);
  });
  it("makes only the widths an original can fill", () => {
    expect(widthsFor(4000)).toEqual([480, 960, 1440]);
    expect(widthsFor(1000)).toEqual([480, 960]);
    expect(widthsFor(300)).toEqual([480]);
  });
  it("srcset lists each width", () => {
    expect(photoSrcset((n) => `/m/${n}`, "b/p", "webp", [480, 960])).toBe("/m/b/p/480.webp 480w, /m/b/p/960.webp 960w");
  });
});

it("cache tags cover the slug and the custom domain", () => {
  expect(siteCacheTags({ slug: "kinigi", custom_domain: "kinigi.rw" })).toEqual(["site:kinigi", "site:kinigi.rw"]);
  expect(siteCacheTags({ slug: "kinigi", custom_domain: null })).toEqual(["site:kinigi"]);
});
