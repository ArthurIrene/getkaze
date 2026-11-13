import type { ContentLocale, LocalizedText } from "./i18n";
import { photoLimits, type PhotoWidth } from "./media";

// Size rules live in ./media (no imports there, so scripts can load them directly).
export { widthsFor } from "./media";

/**
 * Content editor rules (specs/editor-basics.md). Plain checks, no library
 * (like parseBookingRequest): screens pass raw form values in and get either
 * clean values or problem codes back. The database checks the same rules again.
 */

// ---------- Who may edit ----------
export type EditorMember = { roles: readonly string[]; status: string } | null;
export type EditorAdmin = { isPlatformAdmin: boolean; aal: "aal1" | "aal2" | null; openSupport: boolean };
export type EditorAccess = { ok: true; as: "owner" | "support" } | { ok: false };

/** Owners (active, owner role) edit their site; platform admins only at aal2 with an open support session (approved points 1 and 2). */
export function canEditSite(member: EditorMember, admin: EditorAdmin): EditorAccess {
  if (member && member.status === "active" && member.roles.includes("owner")) return { ok: true, as: "owner" };
  if (admin.isPlatformAdmin && admin.aal === "aal2" && admin.openSupport) return { ok: true, as: "support" };
  return { ok: false };
}

// ---------- Small parsers ----------
export type Get = (key: string) => string | null | undefined;
const clean = (v: string | null | undefined, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export const editorLimits = { name: 80, line: 160, text: 300, hours: 8, directions: 6, email: 120 } as const;

/** One translatable field from inputs "<key>.en", "<key>.rw", "<key>.fr". English required unless optional. */
export function parseLocalized(get: Get, key: string, languages: readonly ContentLocale[], max: number = editorLimits.text): LocalizedText | null {
  const en = clean(get(`${key}.en`), max);
  if (!en) return null;
  const out: LocalizedText = { en };
  for (const l of ["rw", "fr"] as const) {
    if (!languages.includes(l)) continue;
    const v = clean(get(`${key}.${l}`), max);
    if (v) out[l] = v;
  }
  return out;
}

/**
 * A Rwanda phone number as "+250 7xx xxx xxx" (accepts 07…, 7…, 250…, +250…, with spaces or dashes).
 * Other international numbers ("+<country>…", 8–15 digits) are kept as typed digits. Null when invalid.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const digits = s.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  let local: string | null = null;
  if (/^07\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^7\d{8}$/.test(digits)) local = digits;
  else if (/^\+?2507\d{8}$/.test(digits)) local = digits.replace(/^\+?250/, "");
  if (local) return `+250 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  if (/^\+(?!250)\d{8,15}$/.test(digits)) return digits;
  return null;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A Google Maps link for a pin. */
export function mapUrlFromCoords(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

const mapHosts = ["google.com", "google.rw", "goo.gl", "maps.app.goo.gl"] as const;

/** Only https map links on known map hosts (no open redirect, no javascript: links). */
export function safeMapUrl(raw: string | null | undefined): string | null {
  const s = clean(raw, 500);
  if (!s) return null;
  // https, a plain host (no user info, no port), then an optional path, query or hash without spaces.
  const m = /^https:\/\/([a-z0-9.-]+)(\/[^\s]*)?$/i.exec(s);
  if (!m) return null;
  const host = m[1]!.toLowerCase();
  if (!mapHosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  return `https://${host}${m[2] ?? "/"}`;
}

function coord(v: string | null | undefined, limit: number): number | null {
  const s = clean(v, 20);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && Math.abs(n) <= limit ? Math.round(n * 1e6) / 1e6 : null;
}

// ---------- Business info ----------
export type BusinessInfo = {
  name: string;
  contacts: { phone: string; whatsapp: string; email?: string };
  location: { map_url: string; lat?: number; lng?: number; area?: LocalizedText; directions: LocalizedText[] };
  hours: LocalizedText[];
};
export type InfoProblem = "name" | "phone" | "whatsapp" | "email" | "map" | "coords";
export type Parsed<T, P> = { ok: true; value: T } | { ok: false; problems: P[] };

/** Rows of a repeatable field: "<key>.<n>.en" for n = 0.. (empty rows are dropped). */
function rows(get: Get, key: string, languages: readonly ContentLocale[], max: number, limit: number): LocalizedText[] {
  const out: LocalizedText[] = [];
  for (let n = 0; n < limit; n++) {
    const t = parseLocalized(get, `${key}.${n}`, languages, max);
    if (t) out.push(t);
  }
  return out;
}

export function parseBusinessInfo(get: Get, languages: readonly ContentLocale[]): Parsed<BusinessInfo, InfoProblem> {
  const problems: InfoProblem[] = [];
  const name = clean(get("name"), editorLimits.name);
  if (!name) problems.push("name");
  const phone = normalizePhone(get("phone"));
  if (!phone) problems.push("phone");
  const whatsapp = normalizePhone(get("whatsapp"));
  if (!whatsapp) problems.push("whatsapp");
  const emailRaw = clean(get("email"), editorLimits.email).toLowerCase();
  if (emailRaw && !emailPattern.test(emailRaw)) problems.push("email");

  const lat = coord(get("lat"), 90);
  const lng = coord(get("lng"), 180);
  const hasCoords = Boolean(clean(get("lat"), 20) || clean(get("lng"), 20));
  if (hasCoords && (lat === null || lng === null)) problems.push("coords");
  const map = safeMapUrl(get("map_url")) ?? (lat !== null && lng !== null ? mapUrlFromCoords(lat, lng) : null);
  if (!map) problems.push("map");
  if (problems.length) return { ok: false, problems };

  const area = parseLocalized(get, "area", languages, editorLimits.line);
  return {
    ok: true,
    value: {
      name,
      contacts: { phone: phone!, whatsapp: whatsapp!, ...(emailRaw ? { email: emailRaw } : {}) },
      location: {
        map_url: map!,
        ...(lat !== null && lng !== null ? { lat, lng } : {}),
        ...(area ? { area } : {}),
        directions: rows(get, "directions", languages, editorLimits.text, editorLimits.directions),
      },
      hours: rows(get, "hours", languages, editorLimits.line, editorLimits.hours),
    },
  };
}

/** Site languages: English always, plus the ones switched on. */
export function parseLanguages(get: Get): ContentLocale[] {
  return ["en", ...(["rw", "fr"] as const).filter((l) => get(`lang.${l}`) === "on")];
}

// ---------- Translation marks (D-048) ----------
/** Field path → languages the owner marked as checked, e.g. {"location.area": ["rw"]}. */
export type TranslationChecks = Record<string, ContentLocale[]>;
export type TranslationState = "missing" | "draft" | "checked";

export function translationState(text: LocalizedText | undefined, lang: Exclude<ContentLocale, "en">, checks: TranslationChecks, path: string): TranslationState {
  const v = text?.[lang];
  if (typeof v !== "string" || !v.trim()) return "missing";
  return (checks[path] ?? []).includes(lang) ? "checked" : "draft";
}

/**
 * New checked marks after a save: a language stays checked only if its text is
 * unchanged, or the owner ticked "checked" in this save ("check.<path>.<lang>").
 */
export function nextChecks(
  before: Record<string, LocalizedText | undefined>,
  after: Record<string, LocalizedText | undefined>,
  checks: TranslationChecks,
  get: Get,
): TranslationChecks {
  const out: TranslationChecks = {};
  for (const [path, text] of Object.entries(after)) {
    const langs = (["rw", "fr"] as const).filter((l) => {
      const v = text?.[l];
      if (!v) return false;
      if (get(`check.${path}.${l}`) === "on") return true;
      return (checks[path] ?? []).includes(l) && before[path]?.[l] === v;
    });
    if (langs.length) out[path] = langs;
  }
  return out;
}

/** Translatable fields of business info, by path (for marks and progress). */
export function infoTexts(info: Pick<BusinessInfo, "location" | "hours">): Record<string, LocalizedText | undefined> {
  const out: Record<string, LocalizedText | undefined> = { "location.area": info.location.area };
  info.location.directions.forEach((t, n) => (out[`location.directions.${n}`] = t));
  info.hours.forEach((t, n) => (out[`hours.${n}`] = t));
  return out;
}

/** How many translatable texts are filled per language. */
export function languageProgress(texts: Record<string, LocalizedText | undefined>, lang: Exclude<ContentLocale, "en">): { done: number; total: number } {
  const present = Object.values(texts).filter((t): t is LocalizedText => Boolean(t?.en));
  return { done: present.filter((t) => Boolean(t[lang]?.trim())).length, total: present.length };
}

// ---------- Editor hub ----------
export type EditorSection = "info" | "photos" | "languages" | "rooms" | "sections" | "look" | "changes";
export type ProgressFacts = { hasContacts: boolean; hasMap: boolean; hasHours: boolean; photos: number; hasHeroPhoto: boolean; rooms: number | null };

/** Done marks per hub row and the overall percentage (O-Editor "85% complete"). */
export function editorProgress(f: ProgressFacts): { done: Partial<Record<EditorSection, boolean>>; percent: number } {
  const done: Partial<Record<EditorSection, boolean>> = {
    info: f.hasContacts && f.hasMap && f.hasHours,
    photos: f.photos >= 3 && f.hasHeroPhoto,
    ...(f.rooms === null ? {} : { rooms: f.rooms > 0 }),
  };
  const values = Object.values(done);
  return { done, percent: Math.round((100 * values.filter(Boolean).length) / values.length) };
}

// ---------- Photos ----------
export const photoPlaces = ["hero", "room", "dining", "host", "gallery"] as const;
export type PhotoPlaceChoice = (typeof photoPlaces)[number];
export type PhotoDetails = { place: PhotoPlaceChoice; itemId: string | null; alt: LocalizedText };
export type PhotoDetailsProblem = "place" | "alt" | "room";

export function parsePhotoDetails(get: Get, languages: readonly ContentLocale[]): Parsed<PhotoDetails, PhotoDetailsProblem> {
  const problems: PhotoDetailsProblem[] = [];
  const place = clean(get("place"), 20) as PhotoPlaceChoice;
  if (!(photoPlaces as readonly string[]).includes(place)) problems.push("place");
  const alt = parseLocalized(get, "alt", languages, editorLimits.line);
  if (!alt) problems.push("alt");
  const item = clean(get("item"), 40);
  const itemId = place === "room" ? item || null : null;
  if (place === "room" && !/^[0-9a-f-]{36}$/.test(item)) problems.push("room");
  return problems.length ? { ok: false, problems } : { ok: true, value: { place, itemId, alt: alt! } };
}


// ---------- Guest site photos ----------
/** srcset for a stored photo folder and type, from the widths it has. */
export function photoSrcset(urlOf: (name: string) => string, folder: string, format: "webp" | "jpg", widths: readonly PhotoWidth[] = photoLimits.widths): string {
  return widths.map((w) => `${urlOf(`${folder}/${w}.${format}`)} ${w}w`).join(", ");
}

// ---------- Cache tags (guest pages, data/get-site.ts) ----------
export function siteCacheTags(b: { slug: string; custom_domain?: string | null }): string[] {
  return [`site:${b.slug}`, ...(b.custom_domain ? [`site:${b.custom_domain}`] : [])];
}
