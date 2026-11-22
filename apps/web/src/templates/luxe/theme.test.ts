import { describe, expect, it } from "vitest";
import { luxeTheme } from "./theme";

describe("luxe theme (Luxe L2a)", () => {
  it("exposes paper, paperDark and accent", () => {
    expect(luxeTheme.paper).toBe("#fbfaf5");
    expect(luxeTheme.paperDark).toBe("#1a1814");
    expect(luxeTheme.accent).toBe("#4a5d4a");
  });
});
