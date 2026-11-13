import { describe, expect, it } from "vitest";
import { rowToSiteData } from "./from-row";

/** A published row as get_published_site returns it (field list in specs/row-level-security.md). */
const row = {
  business: { id: "b1", slug: "kinigi-hills", name: "Kinigi Hills", legalName: "Kinigi Hills Lodge", preset: "hotel_lodge", style: "lodge", template: "field-journal", defaultCurrency: "usd", languages: ["en", "rw"] },
  settings: {
    contacts: { phone: "+250 700 000 000", whatsapp: "+250 700 000 001", email: null },
    location: { map_url: "https://maps.example", area: { en: "Kinigi", rw: "Kinigi (rw)" }, distance_note: { en: "Musanze 25'" }, directions: [{ en: "Turn left" }], address: { locality: "Kinigi", region: "Musanze", country: "RW" } },
    hours: [{ en: "Every day" }],
    payment: [{ en: "Cash" }],
    bookingPayments: ["lodge", "momo", "cheque"],
    stay: { checkIn: "14:00", checkOut: "10:00", breakfastIncluded: true, notes: [{ en: "Kids free" }] },
    sections: [{ id: "hero", visible: true }, { id: "rooms", visible: false }],
    hero: { title: { en: "Wake up" }, line: { en: "facing the volcanoes" }, photo: { id: "hero", place: "hero", alt: { en: "Lodge" } } },
    facts: [{ id: "park", value: { en: "15'" }, icon: "park", detail: { en: "Near the park" } }],
    moments: [{ id: "coffee", caption: { en: "coffee" }, icon: "coffee", photo: { id: "m1", place: "gallery", alt: { en: "Coffee" } } }],
    dining: { name: { en: "the fireside room" }, photo: { id: "dining", place: "dining", alt: { en: "Dining" } } },
    host: { name: "Claudine", greeting: { en: "Muraho!" }, note: { en: "Welcome" }, photo: { id: "host", place: "host", alt: { en: "Host" } } },
    reviews: { quote: { en: "Great" }, scores: [{ source: "TRIPADVISOR", value: "4.6" }] },
    roomsLine: { en: "four rooms" },
    seoDescription: null,
    publishedAt: "2026-11-12T00:00:00Z",
  },
  modulesOn: ["menu", "unknown-module"],
  items: [
    { id: "i2", handle: "garden-double", kind: "room_type", position: 1, name: { en: "Garden Double" }, line: { en: "Queen bed" }, priceRwf: 60000, priceUsd: 45, maxGuests: 2, amenities: [{ icon: "wifi", label: { en: "Wi-Fi" } }], icon: null, distance: null, arrange: false },
    { id: "i1", handle: "garden-single", kind: "room_type", position: 0, name: { en: "Garden Single" }, line: null, priceRwf: 45000, priceUsd: "35.00", maxGuests: 1, amenities: [], icon: null, distance: null, arrange: false },
    { id: "i3", handle: "isombe", kind: "dish", position: 0, name: { en: "Isombe" }, line: null, priceRwf: 6000, priceUsd: 4.5, maxGuests: null, amenities: [], icon: "stew", distance: null, arrange: false },
    { id: "i4", handle: "gorillas", kind: "activity", position: 0, name: { en: "Gorilla trekking" }, line: { en: "Permits" }, priceRwf: null, priceUsd: null, maxGuests: null, amenities: [], icon: "trek", distance: { en: "15'" }, arrange: true },
  ],
  media: [
    { id: "p2", itemId: "i2", place: "room", position: 1, path: null, alt: { en: "View" }, width: null, height: null },
    { id: "p1", itemId: "i2", place: "room", position: 0, path: null, alt: { en: "Bed" }, width: null, height: null },
  ],
};

describe("rowToSiteData", () => {
  it("maps a published row to the SiteData every template reads", () => {
    const r = rowToSiteData(row, "https://getkaze.vercel.app/s/kinigi-hills");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = r.site;
    expect(s).toMatchObject({ name: "Kinigi Hills", propertyStyle: "lodge", defaultCurrency: "usd", languages: ["en", "rw"], baseUrl: "https://getkaze.vercel.app/s/kinigi-hills" });
    expect(s.modulesOn).toEqual(["menu"]);
    expect(s.bookingPayments).toEqual(["lodge", "momo"]);
    expect(s.contacts).toEqual({ phone: "+250 700 000 000", whatsapp: "+250 700 000 001" });
    expect(s.location).toMatchObject({ mapUrl: "https://maps.example", distanceNote: { en: "Musanze 25'" }, directions: [{ en: "Turn left" }] });
    expect(s.sections).toEqual([{ id: "hero", visible: true }, { id: "rooms", visible: false }]);
    expect(s.roomsLine).toEqual({ en: "four rooms" });
    expect(s.seoDescription).toBeUndefined();
  });

  it("orders rooms by position, uses handles as ids, reads numeric prices and keeps photos in order", () => {
    const r = rowToSiteData(row, "x");
    if (!r.ok) throw new Error(r.errors.join());
    expect(r.site.rooms.map((x) => x.id)).toEqual(["garden-single", "garden-double"]);
    expect(r.site.rooms[0]!.price).toEqual({ rwf: 45000, usd: 35 });
    expect(r.site.rooms[0]!.line).toEqual({ en: "" });
    expect(r.site.rooms[1]!.photos.map((p) => p.alt.en)).toEqual(["Bed", "View"]);
    expect(r.site.rooms[1]!.photos[0]!.src).toBeUndefined();
    expect(r.site.dining.dishes[0]).toMatchObject({ id: "isombe", price: { rwf: 6000, usd: 4.5 }, icon: "stew", photo: { id: "isombe-photo", place: "dish" } });
    expect(r.site.activities[0]).toMatchObject({ id: "gorillas", arrange: true, distance: { en: "15'" } });
  });

  it("refuses a broken published site instead of showing it half empty", () => {
    const broken = JSON.parse(JSON.stringify(row)) as typeof row;
    broken.business.template = "neon";
    (broken.settings.hero as { title: unknown }).title = { rw: "only Kinyarwanda" };
    broken.items[0]!.priceUsd = null as unknown as number;
    const r = rowToSiteData(broken, "x");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toEqual(expect.arrayContaining([
      'unknown template "neon"',
      "hero title (English) missing",
      "room garden-double: both prices are required (D-023)",
    ]));
    expect(rowToSiteData(null, "x")).toEqual({ ok: false, errors: ["not a published site"] });
  });
});

describe("uploaded photos", () => {
  const A = "00000000-0000-0000-0000-00000000000a";
  const P = "00000000-0000-0000-0000-0000000000f2";
  const withMedia = (media: unknown[]) => ({ ...row, media: [...row.media, ...media] });
  it("a placed hero photo gets src and srcset from Storage", () => {
    const r = rowToSiteData(withMedia([{ id: "h", itemId: null, place: "hero", position: 0, path: `${A}/${P}`, format: "webp", alt: { en: "Volcanoes" }, width: 1440, height: 960 }]), "x", "http://127.0.0.1:25321");
    if (!r.ok) throw new Error(r.errors.join());
    const base = `http://127.0.0.1:25321/storage/v1/object/public/business-media/${A}/${P}`;
    expect(r.site.hero.photo).toEqual({ id: "h", place: "hero", alt: { en: "Volcanoes" }, src: `${base}/1440.webp`, srcset: `${base}/480.webp 480w, ${base}/960.webp 960w, ${base}/1440.webp 1440w`, width: 1440, height: 960 });
  });
  it("a small JPEG only lists the widths it has; without a Storage base, no src", () => {
    const m = { id: "d", itemId: null, place: "dining", position: 0, path: `${A}/${P}`, format: "jpg", alt: { en: "Table" }, width: 900, height: 600 };
    const r = rowToSiteData(withMedia([m]), "x", "https://s.example");
    expect(r.ok && r.site.dining.photo.srcset).toBe(`https://s.example/storage/v1/object/public/business-media/${A}/${P}/480.jpg 480w`);
    const bare = rowToSiteData(withMedia([m]), "x");
    expect(bare.ok && bare.site.dining.photo.src).toBeUndefined();
  });
});

describe("static photos and credits", () => {
  const credit = { title: "Volcanoes", author: "Nina R", source_url: "https://commons.wikimedia.org/wiki/File:V.jpg", licence: "cc-by-2.0", licence_url: "https://creativecommons.org/licenses/by/2.0/" };
  it("a static photo gets app-relative URLs and its credit; a bad credit is dropped", () => {
    const r = rowToSiteData({ ...row, media: [...row.media, { id: "h", itemId: null, place: "hero", position: 0, path: "demo-photos/hero-volcanoes", source: "static", format: "webp", alt: { en: "V" }, width: 1440, height: 960, credit }] }, "x", "https://s.example");
    if (!r.ok) throw new Error(r.errors.join());
    expect(r.site.hero.photo.src).toBe("/demo-photos/hero-volcanoes/1440.webp");
    expect(r.site.hero.photo.credit).toEqual(credit);
    const bad = rowToSiteData({ ...row, media: [...row.media, { id: "h", itemId: null, place: "hero", position: 0, path: "demo-photos/a", source: "static", alt: { en: "V" }, width: 960, credit: { ...credit, licence: "cc-by-sa-4.0" } }] }, "x");
    expect(bad.ok && bad.site.hero.photo.credit).toBeUndefined();
  });
  it("a static path outside demo-photos/ is not a photo", () => {
    const r = rowToSiteData({ ...row, media: [...row.media, { id: "h", itemId: null, place: "hero", position: 0, path: "../secret", source: "static", alt: { en: "V" } }] }, "x");
    expect(r.ok && r.site.hero.photo.src).toBeUndefined();
  });
});
