import { describe, expect, it } from "vitest";
import { canSetStatus, looksLikeEmail, ownerSiteSummary, siteBaseUrl, sitePath, supportReasonProblems } from "./admin";

describe("site addresses (D-062)", () => {
  it("uses <slug>.<PLATFORM_DOMAIN> once set, else the /s/<slug> fallback", () => {
    expect(siteBaseUrl({ slug: "kinigi-hills" }, { platformDomain: "altavision.rw", fallbackHost: "getkaze.vercel.app" })).toBe("https://kinigi-hills.altavision.rw");
    expect(siteBaseUrl({ slug: "kinigi-hills" }, { fallbackHost: "getkaze.vercel.app" })).toBe("https://getkaze.vercel.app/s/kinigi-hills");
  });

  it("keeps the fallback prefix on every page path", () => {
    expect(sitePath("home", "en", {})).toBe("/");
    expect(sitePath("rooms", "rw", {})).toBe("/rw/rooms");
    expect(sitePath("home", "en", { fallbackSlug: "kh" })).toBe("/s/kh");
    expect(sitePath("home", "rw", { fallbackSlug: "kh" })).toBe("/s/kh/rw");
    expect(sitePath("contact", "rw", { fallbackSlug: "kh" })).toBe("/s/kh/rw/contact");
  });
});

describe("admin checks", () => {
  it("needs a real reason for a support session", () => {
    expect(supportReasonProblems("fix")).toEqual(["too_short"]);
    expect(supportReasonProblems("Fixing the hero text")).toEqual([]);
    expect(supportReasonProblems("x".repeat(201))).toEqual(["too_long"]);
  });

  it("only lets a published site go live", () => {
    expect(canSetStatus("active", { publishedAt: null })).toBe(false);
    expect(canSetStatus("active", { publishedAt: "2026-11-12T10:00:00Z" })).toBe(true);
    expect(canSetStatus("paused", { publishedAt: null })).toBe(true);
  });

  it("checks invite emails", () => {
    expect(looksLikeEmail("owner@example.test")).toBe(true);
    expect(looksLikeEmail("not an email")).toBe(false);
  });
});

describe("ownerSiteSummary", () => {
  it("makes one card per business with status wording, address, languages and modules", () => {
    const cards = ownerSiteSummary(
      [
        { id: "2", name: "Zebra Lodge", slug: "zebra", status: "draft", languages: ["en"], modulesOn: [] },
        { id: "1", name: "Kinigi Hills", slug: "kinigi-hills", status: "active", languages: ["en", "rw"], modulesOn: ["ordering", "menu"] },
      ],
      { fallbackHost: "getkaze.vercel.app" },
    );
    expect(cards).toEqual([
      { id: "1", name: "Kinigi Hills", statusKey: "live", address: "https://getkaze.vercel.app/s/kinigi-hills", languages: ["EN", "RW"], modulesOn: ["menu", "ordering"] },
      { id: "2", name: "Zebra Lodge", statusKey: "notLive", address: "https://getkaze.vercel.app/s/zebra", languages: ["EN"], modulesOn: [] },
    ]);
    expect(ownerSiteSummary([{ id: "3", name: "P", slug: "ppp", status: "paused", languages: ["en"], modulesOn: [] }], { platformDomain: "altavision.rw", fallbackHost: "x" })[0]).toMatchObject({ statusKey: "paused", address: "https://ppp.altavision.rw" });
  });
});
