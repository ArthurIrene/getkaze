import { describe, expect, it } from "vitest";
import { describeChange, groupByDay, timeOfDay } from "./change-log";

describe("describeChange", () => {
  it("names a room price change by area, room and field (once)", () => {
    expect(describeChange({ table_name: "catalog_items", action: "update", fields: ["price_rwf", "price_usd"], label: "Garden room" }))
      .toEqual({ area: "rooms", label: "Garden room", fields: ["price"] });
  });
  it("sorts site settings into the editor's parts", () => {
    expect(describeChange({ table_name: "site_settings", action: "update", fields: ["sections"], label: null }).area).toBe("sections");
    expect(describeChange({ table_name: "site_settings", action: "update", fields: ["look"], label: null }).area).toBe("look");
    expect(describeChange({ table_name: "site_settings", action: "update", fields: ["contacts", "translations_checked"], label: null }))
      .toEqual({ area: "info", label: null, fields: ["contacts", "translations"] });
    expect(describeChange({ table_name: "businesses", action: "update", fields: ["languages"], label: null }).area).toBe("languages");
  });
  it("inserts and deletes list no fields; unknown fields are 'other'", () => {
    expect(describeChange({ table_name: "media", action: "insert", fields: [], label: "hero" })).toEqual({ area: "photos", label: "hero", fields: [] });
    expect(describeChange({ table_name: "catalog_items", action: "update", fields: ["secret"], label: null }).fields).toEqual(["other"]);
  });
});

describe("days in Kigali", () => {
  it("groups by the Kigali calendar day (UTC+2)", () => {
    const rows = [{ at: "2026-11-13T22:30:00Z" }, { at: "2026-11-13T21:59:00Z" }, { at: "2026-11-12T23:00:00Z" }];
    expect(groupByDay(rows).map((g) => [g.day, g.rows.length])).toEqual([["2026-11-14", 1], ["2026-11-13", 2]]);
    expect(timeOfDay("2026-11-13T12:05:00Z")).toBe("14:05");
  });
});
