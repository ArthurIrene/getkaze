import { describe, expect, it } from "vitest";
import { clip, indexedLocales, jsonLdText, localePath, lodgingJsonLd, pageSeo, priceRange, type SeoLabels } from "./seo";
import type { SiteView } from "./site/view";

const labels: SeoLabels = {
  style: (s) => ({ lodge: "Lodge", townHotel: "Hotel", guesthouse: "Guesthouse" })[s],
  homeTitle: (v) => `${v.name} | ${v.style} in ${v.locality}, ${v.region}`,
  pageTitle: (v) => `${v.page} | ${v.name}`,
  pageName: (p) => ({ rooms: "Rooms", contact: "Contact", book: "Check availability", privacy: "Privacy notice" })[p],
  homeDescription: (v) => `${v.title}. ${v.style} in ${v.area}. Rooms from ${v.price}.`,
  roomsDescription: (v) => `${v.count} rooms from ${v.price}${v.breakfast ? ", breakfast included" : ""}.`,
  contactDescription: (v) => `Call, WhatsApp or find ${v.name} in ${v.area}. ${v.hours}.`,
  bookDescription: (v) => `Send ${v.name} a booking request by WhatsApp or email.`,
  privacyDescription: (v) => `How ${v.name} handles your personal data.`,
};

const room = (name: string, usd: number, rwf: number, maxGuests: number) => ({
  id: name,
  name,
  line: "",
  price: { rwf: `RWF ${rwf}`, usd: `USD ${usd}` },
  priceValue: { rwf, usd },
  maxGuests,
  photos: [],
  amenities: [],
});

const view = {
  name: "Kinigi Hills",
  baseUrl: "https://lodge.example",
  propertyStyle: "lodge",
  languages: ["en", "rw"],
  seoDescription: "",
  defaultCurrency: "usd",
  contacts: { phone: "+250 700 000 000", whatsapp: "+250 700 000 000", email: "hello@example.com", telHref: "" },
  location: { mapUrl: "https://maps.example", area: "Kinigi Sector, Musanze District", directions: [], address: { locality: "Kinigi", region: "Musanze", country: "RW" } },
  hours: ["Reception every day, 6:00 to 22:00"],
  hero: { title: "Wake up facing", line: "the volcanoes", photo: { id: "h", place: "hero", alt: "" } },
  rooms: [room("Garden Single", 35, 45000, 1), room("Family Cottage", 75, 100000, 4)],
  stay: { checkIn: "14:00", checkOut: "10:00", breakfastIncluded: true, notes: [] },
} as unknown as SiteView;

describe("paths and languages", () => {
  it("routes English without a prefix and other languages with one", () => {
    expect(localePath("home", "en")).toBe("/");
    expect(localePath("home", "rw")).toBe("/rw");
    expect(localePath("rooms", "rw")).toBe("/rw/rooms");
  });

  it("indexes only translated languages the site can route (D-029)", () => {
    expect(indexedLocales(["en", "rw"], ["en", "rw"])).toEqual(["en", "rw"]);
    expect(indexedLocales(["en"], ["en", "rw"])).toEqual(["en"]);
    expect(indexedLocales(["en", "fr"], ["en", "rw"])).toEqual(["en"]);
  });
});

describe("pageSeo", () => {
  it("builds title, description, canonical and alternates for a translated language", () => {
    const seo = pageSeo("rooms", view, "rw", ["en", "rw"], labels);
    expect(seo.title).toBe("Rooms | Kinigi Hills");
    expect(seo.description).toBe("2 rooms from USD 35, breakfast included.");
    expect(seo.canonical).toBe("https://lodge.example/rw/rooms");
    expect(seo.alternates).toEqual({
      en: "https://lodge.example/rooms",
      rw: "https://lodge.example/rw/rooms",
      "x-default": "https://lodge.example/rooms",
    });
    expect(seo.ogLocale).toBe("rw_RW");
    expect(seo.ogLocaleAlternates).toEqual(["en_US"]);
  });

  it("points an untranslated language to the English page and gives no alternates", () => {
    const seo = pageSeo("rooms", { ...view, languages: ["en"] } as SiteView, "rw", ["en", "rw"], labels);
    expect(seo.canonical).toBe("https://lodge.example/rooms");
    expect(seo.alternates).toEqual({});
    expect(seo.ogLocale).toBe("en_US");
  });

  it("titles the home page with the style and place, and prefers the owner's description", () => {
    const home = pageSeo("home", view, "en", ["en", "rw"], labels);
    expect(home.title).toBe("Kinigi Hills | Lodge in Kinigi, Musanze");
    expect(home.description).toBe("Wake up facing the volcanoes. Lodge in Kinigi Sector, Musanze District. Rooms from USD 35.");
    expect(home.canonical).toBe("https://lodge.example/");
    expect(pageSeo("home", { ...view, seoDescription: "Our own words." } as SiteView, "en", ["en"], labels).description).toBe("Our own words.");
  });

  it("keeps every description within 160 characters", () => {
    const long = pageSeo("home", { ...view, seoDescription: "word ".repeat(80) } as SiteView, "en", ["en"], labels);
    expect(long.description.length).toBeLessThanOrEqual(160);
    expect(long.description.endsWith("…")).toBe(true);
    for (const page of ["home", "rooms", "contact", "book", "privacy"] as const) {
      expect(pageSeo(page, view, "en", ["en", "rw"], labels).description.length).toBeLessThanOrEqual(160);
    }
  });
});

describe("structured data", () => {
  it("describes the lodge with address, times, price range and rooms", () => {
    const data = lodgingJsonLd(view);
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: "Kinigi Hills",
      url: "https://lodge.example/",
      telephone: "+250 700 000 000",
      email: "hello@example.com",
      address: { "@type": "PostalAddress", addressLocality: "Kinigi", addressRegion: "Musanze", addressCountry: "RW" },
      checkinTime: "14:00",
      checkoutTime: "10:00",
      priceRange: "USD 35–75",
    });
    expect(data.containsPlace).toEqual([
      { "@type": "HotelRoom", name: "Garden Single", occupancy: { "@type": "QuantitativeValue", maxValue: 1 } },
      { "@type": "HotelRoom", name: "Family Cottage", occupancy: { "@type": "QuantitativeValue", maxValue: 4 } },
    ]);
    expect(data).not.toHaveProperty("image");
    expect(lodgingJsonLd({ ...view, propertyStyle: "townHotel" } as SiteView)["@type"]).toBe("Hotel");
  });

  it("escapes < so the JSON can never close its script tag", () => {
    expect(jsonLdText({ name: "</script><b>" })).toBe('{"name":"\\u003c/script>\\u003cb>"}');
  });

  it("formats ranges and clips text", () => {
    expect(priceRange([room("a", 35, 1, 1)], "usd")).toBe("USD 35");
    expect(clip("short")).toBe("short");
  });
});
