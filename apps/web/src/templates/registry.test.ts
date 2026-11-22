import { describe, expect, it } from "vitest";
import { templates, templateThemes } from "./registry";
import FieldJournalHome from "./field-journal/home";

describe("template registry (Luxe L2a)", () => {
  it("keeps Field Journal pages statically imported", () => {
    const fj = templates["field-journal"];
    expect(fj?.home).toBe(FieldJournalHome);
    expect(fj?.rooms).toBeDefined();
    expect(fj?.contact).toBeDefined();
    expect(fj?.book).toBeDefined();
    expect(fj?.privacy).toBeDefined();
    expect(fj?.credits).toBeDefined();
  });

  it("does not expose Luxe pages on Field Journal", () => {
    const fj = templates["field-journal"];
    expect((fj as Record<string, unknown>).experiences).toBeUndefined();
    expect((fj as Record<string, unknown>).gallery).toBeUndefined();
  });

  it("registers the field-journal theme", () => {
    const theme = templateThemes["field-journal"];
    expect(theme).toBeDefined();
    expect(theme!.paper).toBe("#f4eee3");
    expect(theme!.accent).toBe("#3f5b3a");
  });
});
