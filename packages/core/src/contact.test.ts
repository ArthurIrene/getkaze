import { describe, expect, it } from "vitest";
import { mailLink, telLink, whatsAppLink } from "./contact";

describe("telLink", () => {
  it("builds a tel: link from a number with spaces", () => {
    expect(telLink("+250 788 123 456")).toBe("tel:+250788123456");
  });
});

describe("whatsAppLink (free click-to-chat)", () => {
  it("uses digits only", () => {
    expect(whatsAppLink("+250 788-123-456")).toBe("https://wa.me/250788123456");
  });

  it("encodes a prefilled message", () => {
    expect(whatsAppLink("+250788123456", "Hello & muraho?")).toBe(
      "https://wa.me/250788123456?text=Hello%20%26%20muraho%3F",
    );
  });
});

describe("mailLink", () => {
  it("builds a plain mailto", () => {
    expect(mailLink(" hello@example.com ")).toBe("mailto:hello@example.com");
  });
  it("encodes subject and body with %20, not +", () => {
    expect(mailLink("a@example.com", "Booking request", "Line 1\nLine & 2")).toBe(
      "mailto:a@example.com?subject=Booking%20request&body=Line%201%0ALine%20%26%202",
    );
  });
});
