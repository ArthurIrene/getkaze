import type { ModuleId } from "./modules";

/** Home page sections a template can show (D-042). */
export const sectionIds = [
  "hero",
  "facts",
  "life",
  "rooms",
  "table",
  "around",
  "host",
  "reviews",
  "findUs",
] as const;
export type SectionId = (typeof sectionIds)[number];

/** The owner's order and on/off choice for one section. */
export type SectionSetting = { id: SectionId; visible: boolean };

/** Sections that only show when a module is on. */
const requiredModule: Partial<Record<SectionId, ModuleId>> = {
  table: "menu",
};

/**
 * Sections to render, in the owner's order: switched on, with their module
 * on, and with content to show. Duplicate ids keep the first one.
 */
export function visibleSections(
  sections: readonly SectionSetting[],
  modulesOn: readonly ModuleId[],
  hasContent: (id: SectionId) => boolean = () => true,
): SectionId[] {
  const seen = new Set<SectionId>();
  const result: SectionId[] = [];
  for (const { id, visible } of sections) {
    if (seen.has(id)) continue;
    seen.add(id);
    const needs = requiredModule[id];
    if (!visible || (needs && !modulesOn.includes(needs)) || !hasContent(id)) continue;
    result.push(id);
  }
  return result;
}
