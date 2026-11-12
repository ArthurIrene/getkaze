import type { ContentLocale, LocalizedText } from "../i18n";
import { currencies, type Currency } from "../money";
import { moduleIds, type ModuleId } from "../modules";
import { paymentMethods, type PaymentMethod } from "../booking";
import type { SectionSetting } from "../sections";
import { templateIds, type Activity, type Amenity, type Dish, type IconKey, type Photo, type PropertyStyle, type Room, type SiteData } from "./types";

/**
 * Map the public site JSON from `get_published_site` (specs/row-level-security.md,
 * "Fields returned") to SiteData, the shape every template reads. Plain checks,
 * no library: a broken published site is reported, never shown half-empty.
 */

type Json = Record<string, unknown>;
export type RowResult = { ok: true; site: SiteData } | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

function text(v: unknown): LocalizedText {
  if (!isObj(v)) return { en: "" };
  const out: LocalizedText = { en: str(v.en) };
  for (const l of ["rw", "fr"] as const) if (typeof v[l] === "string") out[l] = v[l] as string;
  return out;
}
const textOrUndefined = (v: unknown): LocalizedText | undefined => (isObj(v) && typeof v.en === "string" ? text(v) : undefined);

const styles: Record<string, PropertyStyle> = { lodge: "lodge", town_hotel: "townHotel", guesthouse: "guesthouse" };

function photo(v: unknown, fallbackId: string, place: Photo["place"]): Photo {
  if (!isObj(v)) return { id: fallbackId, place, alt: { en: "" } };
  const src = str(v.src) || str(v.path);
  return {
    id: str(v.id, fallbackId),
    place: (str(v.place) as Photo["place"]) || place,
    alt: text(v.alt),
    ...(src.startsWith("https://") || src.startsWith("/") ? { src } : {}),
  };
}

export function rowToSiteData(row: unknown, baseUrl: string): RowResult {
  const errors: string[] = [];
  if (!isObj(row) || !isObj(row.business) || !isObj(row.settings)) return { ok: false, errors: ["not a published site"] };
  const b = row.business;
  const s = row.settings;

  const template = str(b.template);
  if (!(templateIds as readonly string[]).includes(template)) errors.push(`unknown template "${template}"`);
  const style = styles[str(b.style)];
  if (!style) errors.push(`style "${str(b.style)}" is not a Hotel/Lodge style`);
  const currency = str(b.defaultCurrency) as Currency;
  if (!(currencies as readonly string[]).includes(currency)) errors.push("unknown default currency");
  if (!str(b.name)) errors.push("business name missing");

  const contacts = isObj(s.contacts) ? s.contacts : {};
  if (!str(contacts.phone) || !str(contacts.whatsapp)) errors.push("phone or WhatsApp missing");
  const location = isObj(s.location) ? s.location : {};
  if (!str(location.map_url)) errors.push("map link missing");
  const hero = isObj(s.hero) ? s.hero : {};
  if (!text(hero.title).en) errors.push("hero title (English) missing");

  const items = list(row.items).filter(isObj);
  const media = list(row.media).filter(isObj);
  const photosOf = (itemId: unknown, place: Photo["place"]) =>
    media
      .filter((m) => m.itemId === itemId)
      .sort((x, y) => (num(x.position) ?? 0) - (num(y.position) ?? 0))
      .map((m) => photo(m, str(m.id), place));
  const byKind = (kind: string) => items.filter((i) => i.kind === kind).sort((x, y) => (num(x.position) ?? 0) - (num(y.position) ?? 0));
  const price = (i: Json, label: string) => {
    const rwf = num(i.priceRwf);
    const usd = num(i.priceUsd);
    if (rwf === null || usd === null) errors.push(`${label}: both prices are required (D-023)`);
    return { rwf: rwf ?? 0, usd: usd ?? 0 };
  };

  const rooms: Room[] = byKind("room_type").map((i) => ({
    id: str(i.handle) || str(i.id),
    name: text(i.name),
    line: text(i.line),
    price: price(i, `room ${str(i.handle) || str(i.id)}`),
    maxGuests: num(i.maxGuests) ?? 1,
    photos: photosOf(i.id, "room"),
    amenities: list(i.amenities).filter(isObj).map((a) => ({ icon: str(a.icon) as Amenity["icon"], label: text(a.label) })),
  }));

  const dishes: Dish[] = byKind("dish").map((i) => {
    const handle = str(i.handle) || str(i.id);
    const [first] = photosOf(i.id, "dish");
    return {
      id: handle,
      name: text(i.name),
      price: price(i, `dish ${handle}`),
      icon: str(i.icon) as IconKey,
      photo: first ?? { id: `${handle}-photo`, place: "dish", alt: text(i.name) },
    };
  });

  const activities: Activity[] = byKind("activity").map((i) => ({
    id: str(i.handle) || str(i.id),
    name: text(i.name),
    line: text(i.line),
    distance: text(i.distance),
    icon: str(i.icon) as IconKey,
    arrange: i.arrange === true,
  }));

  const stay = isObj(s.stay) ? s.stay : {};
  const dining = isObj(s.dining) ? s.dining : {};
  const host = isObj(s.host) ? s.host : {};
  const reviews = isObj(s.reviews) ? s.reviews : {};
  const address = isObj(location.address) ? location.address : {};

  if (errors.length) return { ok: false, errors };

  const site: SiteData = {
    businessId: str(b.id),
    name: str(b.name),
    baseUrl,
    propertyStyle: style!,
    legalName: str(b.legalName),
    template: template as SiteData["template"],
    defaultCurrency: currency,
    languages: list(b.languages).filter((l): l is ContentLocale => l === "en" || l === "rw" || l === "fr"),
    modulesOn: list(row.modulesOn).filter((m): m is ModuleId => (moduleIds as readonly unknown[]).includes(m)),
    contacts: {
      phone: str(contacts.phone),
      whatsapp: str(contacts.whatsapp),
      ...(str(contacts.email) ? { email: str(contacts.email) } : {}),
    },
    location: {
      mapUrl: str(location.map_url),
      area: text(location.area),
      ...(textOrUndefined(location.distance_note) ? { distanceNote: textOrUndefined(location.distance_note) } : {}),
      directions: list(location.directions).map(text),
      address: { locality: str(address.locality), region: str(address.region), country: str(address.country, "RW") },
    },
    hours: list(s.hours).map(text),
    payment: list(s.payment).map(text),
    bookingPayments: list(s.bookingPayments).filter((p): p is PaymentMethod => (paymentMethods as readonly unknown[]).includes(p)),
    sections: list(s.sections).filter(isObj).map((x) => ({ id: str(x.id), visible: x.visible !== false }) as SectionSetting),
    hero: { title: text(hero.title), line: text(hero.line), photo: photo(hero.photo, "hero", "hero") },
    facts: list(s.facts).filter(isObj).map((f, k) => ({ id: str(f.id, `fact-${k}`), value: text(f.value), icon: str(f.icon) as IconKey, detail: text(f.detail) })),
    moments: list(s.moments).filter(isObj).map((m, k) => ({ id: str(m.id, `moment-${k}`), caption: text(m.caption), icon: str(m.icon) as IconKey, photo: photo(m.photo, `moment-${k}`, "gallery") })),
    rooms,
    ...(textOrUndefined(s.roomsLine) ? { roomsLine: textOrUndefined(s.roomsLine) } : {}),
    ...(textOrUndefined(s.seoDescription) ? { seoDescription: textOrUndefined(s.seoDescription) } : {}),
    stay: {
      checkIn: str(stay.checkIn, "14:00"),
      checkOut: str(stay.checkOut, "10:00"),
      breakfastIncluded: stay.breakfastIncluded === true,
      notes: list(stay.notes).map(text),
    },
    dining: { name: text(dining.name), photo: photo(dining.photo, "dining", "dining"), dishes },
    activities,
    host: { name: str(host.name), greeting: text(host.greeting), note: text(host.note), photo: photo(host.photo, "host", "host") },
    reviews: {
      quote: text(reviews.quote),
      scores: list(reviews.scores).filter(isObj).map((x) => ({ source: str(x.source), value: str(x.value) })),
    },
  };
  return { ok: true, site };
}
