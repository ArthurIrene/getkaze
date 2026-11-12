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
