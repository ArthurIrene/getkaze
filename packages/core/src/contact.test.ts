import { describe, expect, it } from "vitest";
import { telLink, whatsAppLink } from "./contact";

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
