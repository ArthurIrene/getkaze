import { describe, expect, it } from "vitest";
import { pickText } from "./i18n";

describe("pickText (English fallback, D-029)", () => {
  const text = { en: "Rooms", rw: "Ibyumba" };

  it("returns the chosen language when present", () => {
    expect(pickText(text, "rw")).toBe("Ibyumba");
  });

  it("falls back to English when the language is missing", () => {
    expect(pickText(text, "fr")).toBe("Rooms");
  });

  it("falls back to English when the language is empty or blank", () => {
    expect(pickText({ en: "Rooms", rw: "" }, "rw")).toBe("Rooms");
    expect(pickText({ en: "Rooms", rw: "   " }, "rw")).toBe("Rooms");
  });

  it("returns English for English", () => {
    expect(pickText(text, "en")).toBe("Rooms");
  });
});
