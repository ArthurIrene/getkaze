import { describe, expect, it } from "vitest";
import { visibleSections, type SectionSetting } from "./sections";

const all: SectionSetting[] = [
  { id: "hero", visible: true },
  { id: "rooms", visible: true },
  { id: "table", visible: true },
  { id: "reviews", visible: false },
  { id: "findUs", visible: true },
];

describe("visibleSections (D-042)", () => {
  it("keeps the owner's order and drops switched-off sections", () => {
    expect(visibleSections(all, ["menu"])).toEqual(["hero", "rooms", "table", "findUs"]);
  });

  it("follows a reordered list", () => {
    const reordered: SectionSetting[] = [
      { id: "findUs", visible: true },
      { id: "hero", visible: true },
    ];
    expect(visibleSections(reordered, [])).toEqual(["findUs", "hero"]);
  });

  it("hides 'At our table' when the menu module is off", () => {
    expect(visibleSections(all, [])).toEqual(["hero", "rooms", "findUs"]);
  });

  it("hides sections with no content", () => {
    expect(visibleSections(all, ["menu"], (id) => id !== "rooms")).toEqual(["hero", "table", "findUs"]);
  });

  it("ignores duplicate ids after the first", () => {
    expect(
      visibleSections(
        [
          { id: "hero", visible: true },
          { id: "hero", visible: false },
        ],
        [],
      ),
    ).toEqual(["hero"]);
  });
});
