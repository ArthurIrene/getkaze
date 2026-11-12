import { describe, expect, it } from "vitest";
import { canSetStatus, looksLikeEmail, siteBaseUrl, sitePath, supportReasonProblems } from "./admin";

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
