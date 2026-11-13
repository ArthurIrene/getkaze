import type { ContentLocale, LocalizedText } from "./i18n";
import type { ModuleId } from "./modules";
import { requiredModule, sectionIds, type SectionId, type SectionSetting } from "./sections";
import { normalizeSlug } from "./slugs";
import type { AmenityIcon } from "./site/types";
import { editorLimits, parseLocalized, type Get, type Parsed } from "./editor";

/**
 * Editor part 2 rules (specs/editor-rooms-look.md): rooms, sections, look.
 * Plain checks; the database checks prices, look values and ownership again.
 */

// ---------- Order ----------
/** Move one id up or down in a list (no change at the ends or for unknown ids). */
export function moveItem<T extends string>(order: readonly T[], id: T, dir: "up" | "down"): T[] {
  const out = [...order];
  const i = out.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= out.length) return out;
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

/** "id:up" / "id:down" from a move button. */
export function parseMove(raw: string | null | undefined): { id: string; dir: "up" | "down" } | null {
  const m = /^([A-Za-z0-9-]{1,40}):(up|down)$/.exec(String(raw ?? ""));
  return m ? { id: m[1]!, dir: m[2] as "up" | "down" } : null;
}

// ---------- Rooms ----------
export const amenityIcons: readonly AmenityIcon[] = ["bed", "people", "shower", "wifi", "view", "fire", "desk"];
export const roomLimits = { amenities: 6, maxGuests: 50, units: 500, priceRwf: 100_000_000, priceUsd: 100_000 } as const;

export type RoomInput = {
  name: LocalizedText;
  line: LocalizedText | null;
  price_rwf: number;
  price_usd: number;
  max_guests: number;
  units: number;
  amenities: { icon: AmenityIcon; label: LocalizedText }[];
  visible: boolean;
};
export type RoomProblem = "name" | "priceRwf" | "priceUsd" | "maxGuests" | "units" | "amenity";

const int = (v: string | null | undefined) => {
  const s = String(v ?? "").replace(/[\s,]/g, "");
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
};
const usd = (v: string | null | undefined) => {
  const s = String(v ?? "").replace(/[\s,$]/g, "");
  return /^\d{1,6}(\.\d{1,2})?$/.test(s) ? Number(s) : null;
};

/** A room type form: both prices required (D-023), whole RWF, USD to cents. */
export function parseRoom(get: Get, languages: readonly ContentLocale[]): Parsed<RoomInput, RoomProblem> {
  const problems: RoomProblem[] = [];
  const name = parseLocalized(get, "name", languages, editorLimits.name);
  if (!name) problems.push("name");
  const line = parseLocalized(get, "line", languages, editorLimits.line);
  const rwf = int(get("price_rwf"));
  if (rwf === null || rwf > roomLimits.priceRwf) problems.push("priceRwf");
  const dollars = usd(get("price_usd"));
  if (dollars === null || dollars > roomLimits.priceUsd) problems.push("priceUsd");
  const guests = int(get("max_guests"));
  if (guests === null || guests < 1 || guests > roomLimits.maxGuests) problems.push("maxGuests");
  const units = int(get("units") || "1");
  if (units === null || units > roomLimits.units) problems.push("units");
  const amenities: RoomInput["amenities"] = [];
  for (let n = 0; n < roomLimits.amenities; n++) {
    const icon = String(get(`amenity.${n}.icon`) ?? "");
    const label = parseLocalized(get, `amenity.${n}.label`, languages, 40);
    if (!icon && !label) continue;
    if (!(amenityIcons as readonly string[]).includes(icon) || !label) {
      problems.push("amenity");
      break;
    }
    amenities.push({ icon: icon as AmenityIcon, label });
  }
  if (problems.length) return { ok: false, problems };
  return {
    ok: true,
    value: { name: name!, line, price_rwf: rwf!, price_usd: dollars!, max_guests: guests!, units: units!, amenities, visible: get("visible") === "on" },
  };
}

/** A readable, unique handle for guest URLs ("#room-garden-double"), from the English name. */
export function roomHandle(name: string, taken: readonly string[]): string {
  const base = normalizeSlug(name).slice(0, 50) || "room";
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n++) if (!taken.includes(`${base}-${n}`)) return `${base}-${n}`;
}

/** Translatable fields of a room, by path (for marks and progress). */
export function roomTexts(r: Pick<RoomInput, "name" | "line" | "amenities">): Record<string, LocalizedText | undefined> {
  const out: Record<string, LocalizedText | undefined> = { name: r.name, line: r.line ?? undefined };
  r.amenities.forEach((a, n) => (out[`amenity.${n}`] = a.label));
  return out;
}

// ---------- Sections (D-042) ----------
export type SectionsProblem = "order";

/**
 * Sections form: the order comes from hidden "order" inputs (every section once),
 * on/off from "show.<id>" switches. A section whose module is off stays off.
 */
export function parseSections(order: readonly string[], get: Get, modulesOn: readonly ModuleId[]): Parsed<SectionSetting[], SectionsProblem> {
  const ids = order.filter((id): id is SectionId => (sectionIds as readonly string[]).includes(id));
  if (new Set(ids).size !== ids.length || ids.length !== sectionIds.length) return { ok: false, problems: ["order"] };
  return {
    ok: true,
    value: ids.map((id) => {
      const needs = requiredModule[id];
      return { id, visible: get(`show.${id}`) === "on" && (!needs || modulesOn.includes(needs)) };
    }),
  };
}

/** The saved sections in full: every section once, saved order first, new ones (off) at the end. */
export function fullSections(saved: readonly SectionSetting[]): SectionSetting[] {
  const seen = new Set<string>();
  const out: SectionSetting[] = [];
  for (const s of saved) if ((sectionIds as readonly string[]).includes(s.id) && !seen.has(s.id)) (seen.add(s.id), out.push({ id: s.id, visible: s.visible }));
  for (const id of sectionIds) if (!seen.has(id)) out.push({ id, visible: false });
  return out;
}

// ---------- Look & colors (D-040) ----------
export const colorSets = ["auto", "day", "night"] as const;
export type ColorSet = (typeof colorSets)[number];

/** Safe accents: each passes 4.5:1 with its text colour on day (white text, paper) and night (dark text). */
export const accentPalette = [
  { id: "forest", day: "#3f5b3a", night: "#8faf7e" },
  { id: "clay", day: "#9e5530", night: "#e0a07c" },
  { id: "ochre", day: "#7a5d26", night: "#d4b072" },
  { id: "slate", day: "#2b3a4a", night: "#9db4cc" },
  { id: "bark", day: "#5b4636", night: "#c9a88e" },
] as const;
export type AccentId = (typeof accentPalette)[number]["id"];
export type Look = { color_set: ColorSet; accent: AccentId };

export function parseLook(get: Get): Look {
  const set = String(get("color_set") ?? "");
  const accent = String(get("accent") ?? "");
  return {
    color_set: (colorSets as readonly string[]).includes(set) ? (set as ColorSet) : "auto",
    accent: accentPalette.some((a) => a.id === accent) ? (accent as AccentId) : "forest",
  };
}

/** WCAG contrast ratio of two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// ---------- Missing translations ----------
/** How many filled English texts lack each optional language the site has on. */
export function missingTranslations(texts: Record<string, LocalizedText | undefined>, languages: readonly ContentLocale[]): Partial<Record<"rw" | "fr", number>> {
  const out: Partial<Record<"rw" | "fr", number>> = {};
  for (const l of ["rw", "fr"] as const) {
    if (!languages.includes(l)) continue;
    out[l] = Object.values(texts).filter((t) => t?.en && !t[l]?.trim()).length;
  }
  return out;
}
