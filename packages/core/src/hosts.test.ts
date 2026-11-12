import { describe, expect, it } from "vitest";
import { fallbackSlug, normalizeHost, parseHost, parseSiteKey, servesPlatformScreens, siteKey, splitLocale, type HostSettings } from "./hosts";

const before: HostSettings = { platformHosts: ["getkaze.vercel.app"], demoSlug: "kinigi-hills" };
const after: HostSettings = { ...before, platformDomain: "altavision.rw", appHost: "kaze.altavision.rw" };

describe("parseHost (D-062)", () => {
  it("finds a business by subdomain once the platform domain is set", () => {
    expect(parseHost("kinigi-hills.altavision.rw", "/rooms", after)).toEqual({ kind: "site", slug: "kinigi-hills", via: "subdomain" });
    expect(parseHost("Kinigi-Hills.AltaVision.rw:443", "/", after)).toEqual({ kind: "site", slug: "kinigi-hills", via: "subdomain" });
  });

  it("refuses reserved and nested subdomains", () => {
    expect(parseHost("admin.altavision.rw", "/", after)).toEqual({ kind: "unknown" });
    expect(parseHost("a.b.altavision.rw", "/", after)).toEqual({ kind: "unknown" });
    expect(parseHost("mail.altavision.rw", "/", after)).toEqual({ kind: "unknown" });
  });

  it("serves our screens on the app host and the demo at the bare domain", () => {
    expect(parseHost("kaze.altavision.rw", "/login", after)).toEqual({ kind: "platform" });
    expect(parseHost("altavision.rw", "/", after)).toEqual({ kind: "site", slug: "kinigi-hills", via: "demo" });
    expect(parseHost("www.altavision.rw", "/", after)).toEqual({ kind: "site", slug: "kinigi-hills", via: "demo" });
  });

  it("uses the /s/<slug> fallback and the demo on platform hosts, before the domain exists", () => {
    expect(parseHost("getkaze.vercel.app", "/s/volcano-view/rw/rooms", before)).toEqual({ kind: "site", slug: "volcano-view", via: "path" });
    expect(parseHost("getkaze.vercel.app", "/", before)).toEqual({ kind: "site", slug: "kinigi-hills", via: "demo" });
    expect(parseHost("getkaze-git-x-irenearthurs-projects.vercel.app", "/rooms", before)).toEqual({ kind: "site", slug: "kinigi-hills", via: "demo" });
    expect(parseHost("127.0.0.1:3200", "/s/kinigi-hills", before)).toEqual({ kind: "site", slug: "kinigi-hills", via: "path" });
    expect(parseHost("getkaze.vercel.app", "/s/admin", before)).toEqual({ kind: "unknown" });
    expect(parseHost("getkaze.vercel.app", "/s/", before)).toEqual({ kind: "unknown" });
  });

  it("treats any other host as a custom domain, and rejects junk", () => {
    expect(parseHost("www.kinigihills.rw", "/", after)).toEqual({ kind: "custom", host: "www.kinigihills.rw" });
    expect(parseHost("10.0.0.7", "/", after)).toEqual({ kind: "unknown" });
    expect(parseHost("bad_host!", "/", after)).toEqual({ kind: "unknown" });
    expect(parseHost(undefined, "/", after)).toEqual({ kind: "unknown" });
    expect(parseHost("x".repeat(300) + ".rw", "/", after)).toEqual({ kind: "unknown" });
  });
});

describe("site keys", () => {
  it("round-trips a slug, a fallback slug and a custom host", () => {
    expect(siteKey({ kind: "site", slug: "kh", via: "demo" })).toBe("kh");
    const fallback = siteKey({ kind: "site", slug: "kinigi-hills", via: "path" });
    expect(fallback).toBe("p~kinigi-hills");
    expect(parseSiteKey(fallback)).toEqual({ slug: "kinigi-hills", base: "/s/kinigi-hills" });
    expect(parseSiteKey("kinigi-hills")).toEqual({ slug: "kinigi-hills", base: "" });
    expect(parseSiteKey(siteKey({ kind: "custom", host: "www.kinigihills.rw" }))).toEqual({ host: "www.kinigihills.rw", base: "" });
    expect(parseSiteKey("p~admin")).toBeNull();
    expect(parseSiteKey("Bad Slug")).toBeNull();
  });

  it("helpers", () => {
    expect(normalizeHost("Example.RW.")).toBe("example.rw");
    expect(fallbackSlug("/s/kinigi-hills/rooms")).toBe("kinigi-hills");
    expect(fallbackSlug("/rooms")).toBeNull();
  });
});

describe("platform screens and languages", () => {
  it("serves login, owner and admin only on platform hosts", () => {
    expect(servesPlatformScreens("getkaze.vercel.app", before)).toBe(true);
    expect(servesPlatformScreens("127.0.0.1:3200", before)).toBe(true);
    expect(servesPlatformScreens("kaze.altavision.rw", after)).toBe(true);
    expect(servesPlatformScreens("kinigi-hills.altavision.rw", after)).toBe(false);
    expect(servesPlatformScreens("www.kinigihills.rw", after)).toBe(false);
  });

  it("splits the language prefix", () => {
    expect(splitLocale("/rw/rooms", ["en", "rw"], "en")).toEqual({ locale: "rw", rest: "/rooms" });
    expect(splitLocale("/rw", ["en", "rw"], "en")).toEqual({ locale: "rw", rest: "/" });
    expect(splitLocale("/rooms", ["en", "rw"], "en")).toEqual({ locale: "en", rest: "/rooms" });
    expect(splitLocale("/en/rooms", ["en", "rw"], "en")).toEqual({ locale: "en", rest: "/en/rooms" });
    expect(splitLocale("/", ["en", "rw"], "en")).toEqual({ locale: "en", rest: "/" });
  });
});
