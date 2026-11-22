import { describe, expect, it } from "vitest";
import { luxeTheme } from "./theme";

describe("luxe theme (Luxe L2a)", () => {
  it("exposes paper, paperDark and accent", () => {
    expect(luxeTheme.paper).toBe("#efece6");
    expect(luxeTheme.paperDark).toBe("#efece6");
    expect(luxeTheme.accent).toBe("#4a5a44");
  });
});
