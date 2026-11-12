import { describe, expect, it } from "vitest";
import type { Photo, SiteData } from "./types";
import { toSiteView } from "./view";

const photo = (id: string): Photo => ({ id, place: "gallery", alt: { en: "Photo", rw: "Ifoto" } });

const site: SiteData = {
  businessId: "test-business",
  name: "Test Lodge",
  legalName: "Test Lodge Ltd",
  template: "field-journal",
  defaultCurrency: "usd",
  languages: ["en", "rw"],
  modulesOn: [],
  contacts: { phone: "+250 788 000 000", whatsapp: "+250 788 000 001" },
  location: { mapUrl: "https://maps.example/test", area: { en: "Kinigi" }, directions: [{ en: "Turn left", rw: "Kata ibumoso" }] },
  hours: [{ en: "Every day", rw: "Buri munsi" }],
  payment: [{ en: "Cash" }],
  sections: [
    { id: "hero", visible: true },
    { id: "rooms", visible: true },
    { id: "table", visible: true },
    { id: "around", visible: true },
  ],
  hero: { title: { en: "Welcome", rw: "Murakaza neza" }, line: { en: "to the hills" }, photo: photo("hero") },
  facts: [],
  moments: [],
  rooms: [
    {
      id: "r1",
      name: { en: "Garden Double" },
      line: { en: "Quiet" },
      price: { rwf: 60000, usd: 45 },
      maxGuests: 2,
      photos: [],
      amenities: [{ icon: "wifi", label: { en: "Wi-Fi", rw: "Wi-Fi" } }, { icon: "bed", label: { en: "Queen" } }],
    },
  ],
  roomsLine: { en: "one view", rw: "ahantu hamwe" },
  stay: { checkIn: "14:00", checkOut: "10:00", breakfastIncluded: true, notes: [{ en: "Children under 5 stay free" }] },
  dining: { name: { en: "Dining room" }, photo: photo("dining"), dishes: [] },
  activities: [],
  host: { name: "Host", greeting: { en: "Hello" }, note: { en: "Note" }, photo: photo("host") },
  reviews: { quote: { en: "" }, scores: [] },
};

describe("toSiteView", () => {
  it("picks Kinyarwanda and falls back to English per text", () => {
    const view = toSiteView(site, "rw");
    expect(view.hero.title).toBe("Murakaza neza");
    expect(view.hero.line).toBe("to the hills");
    expect(view.rooms[0]?.name).toBe("Garden Double");
    expect(view.hours).toEqual(["Buri munsi"]);
    expect(view.location.directions).toEqual(["Kata ibumoso"]);
  });

  it("formats each price in both currencies and keeps the default currency", () => {
    const view = toSiteView(site, "en");
    expect(view.rooms[0]?.price).toEqual({ rwf: "RWF 60,000", usd: "USD 45" });
    expect(view.defaultCurrency).toBe("usd");
  });

  it("drops sections with no content or no module", () => {
    // table: menu module off; around: no activities.
    expect(toSiteView(site, "en").sections).toEqual(["hero", "rooms"]);
  });

  it("picks room amenities, the rooms line and stay notes with English fallback", () => {
    const view = toSiteView(site, "rw");
    expect(view.rooms[0]?.amenities).toEqual([
      { icon: "wifi", label: "Wi-Fi" },
      { icon: "bed", label: "Queen" },
    ]);
    expect(view.roomsLine).toBe("ahantu hamwe");
    expect(view.stay).toEqual({ checkIn: "14:00", checkOut: "10:00", breakfastIncluded: true, notes: ["Children under 5 stay free"] });
    expect(toSiteView({ ...site, roomsLine: undefined }, "en").roomsLine).toBe("");
  });

  it("builds the Call link", () => {
    expect(toSiteView(site, "en").contacts.telHref).toBe("tel:+250788000000");
  });
});
