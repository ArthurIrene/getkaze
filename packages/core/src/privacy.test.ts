import { describe, expect, it } from "vitest";
import { privacyFacts } from "./privacy";
import type { SiteView } from "./site/view";

const view = {
  name: "Test Lodge",
  legalName: "Test Lodge Ltd",
  location: { area: "Kinigi" },
  contacts: { phone: "+250 788 000 000", whatsapp: "+250 788 000 001", telHref: "tel:+250788000000" },
} as unknown as SiteView;

const platform = {
  name: "GetKaze",
  company: "Altavision",
  privacyNotice: { status: "draft" as const, updated: "2026-11-12", registration: null },
  hosting: [{ provider: "Vercel", where: { en: "United States", rw: "Amerika" } }],
};

describe("privacyFacts", () => {
  it("fills the notice from business data and platform config", () => {
    expect(privacyFacts(view, platform, "rw")).toEqual({
      business: "Test Lodge",
      legalName: "Test Lodge Ltd",
      area: "Kinigi",
      phone: "+250 788 000 000",
      whatsapp: "+250 788 000 001",
      processor: "Altavision",
      platform: "GetKaze",
      hosting: "Vercel, Amerika",
      draft: true,
      updated: "2026-11-12",
    });
  });

  it("adds the email and registration only when they exist", () => {
    const withEmail = { ...view, contacts: { ...view.contacts, email: "a@example.com" } } as SiteView;
    const reviewed = { ...platform, privacyNotice: { status: "reviewed" as const, updated: "2027-01-01", registration: "NCSA-123" } };
    const facts = privacyFacts(withEmail, reviewed, "en");
    expect(facts.email).toBe("a@example.com");
    expect(facts.registration).toBe("NCSA-123");
    expect(facts.draft).toBe(false);
  });
});
