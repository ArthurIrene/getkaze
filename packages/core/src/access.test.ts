import { describe, expect, it } from "vitest";
import { canEnter, confirmTarget, isPlatformPath, landingFor, passwordProblems, safeNext, type SessionFacts } from "./access";

const base: SessionFacts = { signedIn: true, aal: "aal1", isPlatformAdmin: false, hasTotp: false, activeMemberships: 1 };

describe("canEnter", () => {
  it("sends signed-out visitors to login", () => {
    expect(canEnter("owner", { ...base, signedIn: false })).toEqual({ ok: false, to: "login" });
    expect(canEnter("admin", { ...base, signedIn: false })).toEqual({ ok: false, to: "login" });
  });

  it("lets owners with an active membership in, and others to the no-site page", () => {
    expect(canEnter("owner", base)).toEqual({ ok: true });
    expect(canEnter("owner", { ...base, activeMemberships: 0 })).toEqual({ ok: false, to: "no-site" });
  });

  it("requires a platform admin with TOTP and aal2 for the admin (D-060)", () => {
    expect(canEnter("admin", base)).toEqual({ ok: false, to: "owner" });
    const admin = { ...base, isPlatformAdmin: true };
    expect(canEnter("admin", admin)).toEqual({ ok: false, to: "mfa-enroll" });
    expect(canEnter("admin", { ...admin, hasTotp: true })).toEqual({ ok: false, to: "mfa-verify" });
    expect(canEnter("admin", { ...admin, hasTotp: true, aal: "aal2" })).toEqual({ ok: true });
  });
});

describe("redirects", () => {
  it("lands admins on /admin and owners on /owner", () => {
    expect(landingFor({ isPlatformAdmin: true })).toBe("/admin");
    expect(landingFor({ isPlatformAdmin: false })).toBe("/owner");
  });

  it("allows only our own next pages", () => {
    expect(safeNext("/admin")).toBe("/admin");
    expect(safeNext("https://evil.example")).toBe("/owner");
    expect(safeNext("//evil.example")).toBe("/owner");
    expect(safeNext("/owner/../admin")).toBe("/owner");
    expect(safeNext(undefined, "/auth/accept")).toBe("/auth/accept");
  });

  it("maps email link types", () => {
    expect(confirmTarget("invite")).toBe("/auth/accept");
    expect(confirmTarget("recovery")).toBe("/auth/update-password");
    expect(confirmTarget("signup")).toBeNull();
    expect(confirmTarget(null)).toBeNull();
  });
});

describe("passwordProblems", () => {
  it("accepts a good password and names problems", () => {
    expect(passwordProblems("volcano-sunrise", "volcano-sunrise")).toEqual([]);
    expect(passwordProblems("short")).toEqual(["too_short"]);
    expect(passwordProblems("1234567890")).toEqual(["only_digits"]);
    expect(passwordProblems("a".repeat(73))).toEqual(["too_long"]);
    expect(passwordProblems("volcano-sunrise", "volcano-sunset")).toEqual(["mismatch"]);
  });
});

describe("isPlatformPath", () => {
  it("matches only login, auth, owner and admin paths, in any language", () => {
    for (const p of ["/login", "/rw/login", "/auth/confirm", "/owner", "/admin", "/admin/b/1", "/rw/admin/mfa"]) expect(isPlatformPath(p), p).toBe(true);
    for (const p of ["/", "/rw", "/rooms", "/rw/rooms", "/book", "/administrator", "/ownership", "/s/kinigi-hills"]) expect(isPlatformPath(p), p).toBe(false);
  });
});
