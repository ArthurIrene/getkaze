import { describe, expect, it } from "vitest";
import { presetDefaults, styleFitsPreset } from "./presets";
import { normalizeSlug, reservedSlugs, slugProblems } from "./slugs";

describe("slugs", () => {
  it("accepts good slugs", () => {
    expect(slugProblems("kinigi-hills")).toEqual([]);
    expect(slugProblems("abc")).toEqual([]);
  });

  it("names every problem", () => {
    expect(slugProblems("")).toEqual(["empty"]);
    expect(slugProblems("ab")).toEqual(["too_short"]);
    expect(slugProblems("a".repeat(41))).toEqual(["too_long"]);
    expect(slugProblems("Bad Slug")).toEqual(["format"]);
    expect(slugProblems("double--dash")).toEqual(["format"]);
    expect(slugProblems("-edge")).toEqual(["format"]);
    expect(slugProblems("kaze")).toEqual(["reserved"]);
    expect(slugProblems("www")).toEqual(["reserved"]);
  });

  it("reserves the D-062 names", () => {
    for (const name of ["www", "mail", "admin", "app", "api", "kaze"]) expect(reservedSlugs).toContain(name);
  });

  it("suggests a slug from a name", () => {
    expect(normalizeSlug("Kinigi Hills")).toBe("kinigi-hills");
    expect(normalizeSlug("  Hôtel Été d'Or  ")).toBe("hotel-ete-dor");
    expect(normalizeSlug("Volcano View -- Lodge!")).toBe("volcano-view-lodge");
    expect(normalizeSlug("x".repeat(60)).length).toBe(40);
  });
});

describe("presets", () => {
  it("starts a hotel with the menu module and every home section", () => {
    expect(presetDefaults("hotel_lodge").modulesOn).toEqual(["menu"]);
    expect(presetDefaults("hotel_lodge").sections).toContain("rooms");
    expect(presetDefaults("restaurant_bar").sections).not.toContain("rooms");
  });

  it("checks that a style fits its preset", () => {
    expect(styleFitsPreset("hotel_lodge", "guesthouse")).toBe(true);
    expect(styleFitsPreset("restaurant_bar", "lodge")).toBe(false);
  });
});
