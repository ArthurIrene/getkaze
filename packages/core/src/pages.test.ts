import { describe, expect, it } from "vitest";
import { menuPages, pagePaths, sitePages } from "./pages";

describe("sitePages", () => {
  it("includes rooms and the booking request only when there are rooms", () => {
    expect(sitePages({ rooms: [], credits: [] })).toEqual(["home", "contact", "privacy"]);
    expect(sitePages({ rooms: [{} as never], credits: [] })).toEqual(["home", "rooms", "contact", "book", "privacy"]);
  });

  it("includes photo credits only when the site has credited photos", () => {
    expect(sitePages({ rooms: [], credits: [{} as never] })).toEqual(["home", "contact", "privacy", "credits"]);
  });

  it("lists menu pages in order, without home (the name links home), privacy or book", () => {
    expect(menuPages(["home", "rooms", "contact", "book", "privacy"])).toEqual(["rooms", "contact"]);
    expect(menuPages(["privacy", "contact", "home"])).toEqual(["contact"]);
  });

  it("has a path for every page", () => {
    expect(pagePaths.home).toBe("/");
    expect(pagePaths.rooms).toBe("/rooms");
  });
});
