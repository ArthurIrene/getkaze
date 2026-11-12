import { describe, expect, it } from "vitest";
import { initials, shortName } from "./brand";

describe("brand placeholders", () => {
  it("takes up to two initials", () => {
    expect(initials("Kinigi Hills")).toBe("KH");
    expect(initials("Ikaze")).toBe("I");
    expect(initials("  la  maison d'été ")).toBe("LM");
    expect(initials("Hôtel Émeraude des Volcans")).toBe("HÉ");
  });

  it("keeps short names and shortens long ones to the first word", () => {
    expect(shortName("Kinigi Hills")).toBe("Kinigi Hills");
    expect(shortName("Volcano View Guesthouse")).toBe("Volcano");
    expect(shortName("Supercalifragilistic Lodge")).toBe("Supercalifra");
  });
});
