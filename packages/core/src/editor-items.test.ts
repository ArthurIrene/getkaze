import { describe, expect, it } from "vitest";
import { accentPalette, contrast, fullSections, missingTranslations, moveItem, parseLook, parseMove, parseRoom, parseSections, roomHandle } from "./editor-items";
import { sectionIds } from "./sections";

const form = (o: Record<string, string>) => (k: string) => o[k];

describe("order", () => {
  it("moves up and down, not past the ends", () => {
    expect(moveItem(["a", "b", "c"], "c", "up")).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], "a", "up")).toEqual(["a", "b", "c"]);
    expect(moveItem(["a", "b", "c"], "x", "down")).toEqual(["a", "b", "c"]);
  });
  it("reads move buttons", () => {
    expect(parseMove("rooms:up")).toEqual({ id: "rooms", dir: "up" });
    expect(parseMove("rooms:sideways")).toBeNull();
  });
});

describe("parseRoom", () => {
  const good = { "name.en": "Garden room", "name.rw": "Icyumba", "price_rwf": "120,000", "price_usd": "90", "max_guests": "2", "units": "3", visible: "on",
    "amenity.0.icon": "wifi", "amenity.0.label.en": "Wi-Fi" };
  it("cleans a room with both prices", () => {
    const r = parseRoom(form(good), ["en", "rw"]);
    expect(r.ok && r.value).toEqual({ name: { en: "Garden room", rw: "Icyumba" }, line: null, price_rwf: 120000, price_usd: 90, max_guests: 2, units: 3,
      amenities: [{ icon: "wifi", label: { en: "Wi-Fi" } }], visible: true });
  });
  it("needs both prices (D-023) and sane numbers", () => {
    const r = parseRoom(form({ ...good, price_usd: "", max_guests: "0", "amenity.1.icon": "pool", "amenity.1.label.en": "Pool" }), ["en"]);
    expect(!r.ok && r.problems).toEqual(["priceUsd", "maxGuests", "amenity"]);
    expect(parseRoom(form({ ...good, price_rwf: "12.5" }), ["en"]).ok).toBe(false);
    expect(parseRoom(form({ ...good, price_usd: "45.50" }), ["en"]).ok).toBe(true);
  });
  it("handles are readable and unique", () => {
    expect(roomHandle("Garden Double", [])).toBe("garden-double");
    expect(roomHandle("Garden Double", ["garden-double", "garden-double-2"])).toBe("garden-double-3");
  });
});

describe("sections", () => {
  const order = [...sectionIds].reverse();
  it("keeps the owner's order and switches; a section needing an off module stays off", () => {
    const r = parseSections(order, form({ "show.rooms": "on", "show.table": "on" }), []);
    expect(r.ok && r.value[0]).toEqual({ id: order[0], visible: false });
    expect(r.ok && r.value.find((s) => s.id === "rooms")?.visible).toBe(true);
    expect(r.ok && r.value.find((s) => s.id === "table")?.visible).toBe(false);
  });
  it("refuses a broken order", () => {
    expect(parseSections(["hero", "hero"], form({}), []).ok).toBe(false);
  });
  it("fills in sections the site never saved", () => {
    expect(fullSections([{ id: "rooms", visible: true }]).map((s) => s.id)).toEqual(["rooms", ...sectionIds.filter((i) => i !== "rooms")]);
  });
});

describe("look", () => {
  it("falls back to Auto and Forest", () => {
    expect(parseLook(form({ color_set: "night", accent: "clay" }))).toEqual({ color_set: "night", accent: "clay" });
    expect(parseLook(form({ color_set: "dusk", accent: "pink" }))).toEqual({ color_set: "auto", accent: "forest" });
  });
  it("every accent passes 4.5:1 on day (white text, paper) and night (dark text)", () => {
    for (const a of accentPalette) {
      expect(contrast(a.day, "#ffffff"), `${a.id} day on white`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(a.day, "#f4eee3"), `${a.id} day on paper`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(a.night, "#1e1b17"), `${a.id} night`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

it("counts missing translations per language that is on", () => {
  expect(missingTranslations({ a: { en: "A", rw: "a" }, b: { en: "B" }, c: undefined }, ["en", "rw"])).toEqual({ rw: 1 });
});
