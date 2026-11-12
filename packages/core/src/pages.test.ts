import { describe, expect, it } from "vitest";
import { menuPages, pagePaths, sitePages } from "./pages";

describe("sitePages", () => {
  it("includes rooms and the booking request only when there are rooms", () => {
    expect(sitePages({ rooms: [] })).toEqual(["home", "contact", "privacy"]);
    expect(sitePages({ rooms: [{} as never] })).toEqual(["home", "rooms", "contact", "book", "privacy"]);
  });

  it("lists menu pages in order, without privacy or book", () => {
    expect(menuPages(["home", "rooms", "contact", "book", "privacy"])).toEqual(["home", "rooms", "contact"]);
    expect(menuPages(["privacy", "contact", "home"])).toEqual(["home", "contact"]);
  });

  it("has a path for every page", () => {
    expect(pagePaths.home).toBe("/");
    expect(pagePaths.rooms).toBe("/rooms");
  });
});
