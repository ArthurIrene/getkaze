import type { ModuleId } from "./modules";
import type { SectionId } from "./sections";

/** Business types (D-016) and their styles (D-043). Same values as the database checks. */
export const presets = {
  hotel_lodge: ["lodge", "town_hotel", "guesthouse"],
  restaurant_bar: ["restaurant_first", "bar_first"],
} as const;
export type Preset = keyof typeof presets;
export type BusinessStyle = (typeof presets)[Preset][number];

/** The preset a style belongs to ("guesthouse" → hotel_lodge), or null for an unknown style. */
export function presetOfStyle(style: string): Preset | null {
  for (const preset of Object.keys(presets) as Preset[]) {
    if ((presets[preset] as readonly string[]).includes(style)) return preset;
  }
  return null;
}

export function styleFitsPreset(preset: Preset, style: string): style is BusinessStyle {
  return (presets[preset] as readonly string[]).includes(style);
}

/**
 * What a new business starts with (BUSINESS_TYPES.md, D-046: the hotel
 * Starter includes a basic menu). Other modules arrive switched off (D-021).
 */
export function presetDefaults(preset: Preset): { modulesOn: ModuleId[]; sections: SectionId[] } {
  if (preset === "hotel_lodge") {
    return {
      modulesOn: ["menu"],
      sections: ["hero", "facts", "life", "rooms", "table", "around", "host", "reviews", "findUs"],
    };
  }
  return { modulesOn: ["menu"], sections: ["hero", "facts", "life", "table", "host", "reviews", "findUs"] };
}
