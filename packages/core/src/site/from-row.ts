import type { ContentLocale, LocalizedText } from "../i18n";
import { currencies, type Currency } from "../money";
import { moduleIds, type ModuleId } from "../modules";
import { paymentMethods, type PaymentMethod } from "../booking";
import type { SectionSetting } from "../sections";
import { photoLicences, photoLimits, publicMediaUrl, staticPhotoPattern, staticPhotoUrls, type PhotoCredit, type PhotoWidth } from "../media";
import { photoSrcset, widthsFor } from "../editor";
import { templateIds, type Activity, type ActivityCategory, type Amenity, type ArrangedBy, type CatalogGroup, type Dish, type IconKey, type Photo, type PropertyStyle, type Room, type Service, type SiteData } from "./types";

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

const folderPattern = /^[0-9a-f-]{36}\/[0-9a-f-]{36}$/;

/**
 * A photo. Uploaded photos (a media row with a folder path) get the largest
 * stored width as src and every stored width in srcset; the files live in
 * Storage at mediaBase (approved point 4: plain <img srcset>, no optimizer).
 */
function creditOf(v: unknown): PhotoCredit | undefined {
  if (!isObj(v)) return undefined;
  const licence = str(v.licence) as PhotoCredit["licence"];
  if (!str(v.title) || !str(v.author) || !str(v.source_url).startsWith("https://") || !(photoLicences as readonly string[]).includes(licence)) return undefined;
  return { title: str(v.title), author: str(v.author), source_url: str(v.source_url), licence, ...(str(v.licence_url).startsWith("https://") ? { licence_url: str(v.licence_url) } : {}) };
}

function photo(v: unknown, fallbackId: string, place: Photo["place"], mediaBase?: string): Photo {
  if (!isObj(v)) return { id: fallbackId, place, alt: { en: "" } };
  const credit = creditOf(v.credit);
  const base = { id: str(v.id, fallbackId), place: (str(v.place) as Photo["place"]) || place, alt: text(v.alt), ...(credit ? { credit } : {}) };
  const path = str(v.path);
  const w = num(v.width);
  const h = num(v.height);
  // Static photos (seed data only): bundled with the app, same widths as uploads.
  if (str(v.source) === "static" && staticPhotoPattern.test(path)) {
    const format = str(v.format) === "jpg" ? "jpg" : "webp";
    return { ...base, source: "static", path, format, ...staticPhotoUrls(path, format, w ?? photoLimits.widths[0]), ...(w && h ? { width: w, height: h } : {}) };
  }
  if (mediaBase && folderPattern.test(path)) {
    const format = str(v.format) === "jpg" ? "jpg" : "webp";
    const largest = Math.min(num(v.width) ?? photoLimits.widths[0], photoLimits.widths[photoLimits.widths.length - 1]!);
    const widths = widthsFor(largest);
    const urlOf = (name: string) => publicMediaUrl(name, mediaBase);
    const top = widths[widths.length - 1] as PhotoWidth;
    return { ...base, src: urlOf(`${path}/${top}.${format}`), srcset: photoSrcset(urlOf, path, format, widths), ...(w && h ? { width: w, height: h } : {}) };
  }
  const src = str(v.src) || path;
  return { ...base, ...(src.startsWith("https://") || src.startsWith("/") ? { src } : {}) };
}

export function rowToSiteData(row: unknown, baseUrl: string, mediaBase?: string): RowResult {
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
      .map((m) => photo(m, str(m.id), place, mediaBase));
  // A photo the owner placed (hero, dining, host) replaces the drawing set in the settings.
  const placed = (place: Photo["place"], fallback: unknown, id: string) => {
    const m = media.filter((x) => x.place === place && !x.itemId && str(x.path)).sort((x, y) => (num(x.position) ?? 0) - (num(y.position) ?? 0))[0];
    return m ? photo(m, str(m.id), place, mediaBase) : photo(fallback, id, place);
  };
  const galleryMedia = media
    .filter((m) => m.place === "gallery" && !m.itemId && str(m.path))
    .sort((x, y) => (num(x.position) ?? 0) - (num(y.position) ?? 0))
    .map((m) => photo(m, str(m.id), "gallery", mediaBase));
  const byKind = (kind: string) => items.filter((i) => i.kind === kind).sort((x, y) => (num(x.position) ?? 0) - (num(y.position) ?? 0));
  const price = (i: Json, label: string) => {
    const rwf = num(i.priceRwf);
    const usd = num(i.priceUsd);
    if (rwf === null || usd === null) errors.push(`${label}: both prices are required (D-023)`);
    return { rwf: rwf ?? 0, usd: usd ?? 0 };
  };
  const optionalPrice = (i: Json, label: string) => {
    const rwf = num(i.priceRwf);
    const usd = num(i.priceUsd);
    if (rwf === null && usd === null) return undefined;
    if (rwf === null || usd === null) {
      errors.push(`${label}: both prices are required (D-023)`);
      return undefined;
    }
    return { rwf, usd };
  };
  const categories: readonly ActivityCategory[] = ["wildlife", "hiking", "culture"];
  const arrangedByValues: readonly ArrangedBy[] = ["own_guides", "licensed_partner"];
  const itemPhotos = (itemId: unknown, place: Photo["place"], fallbackPlace?: Photo["place"]) => {
    const primary = photosOf(itemId, place);
    if (primary.length) return primary;
    return fallbackPlace ? photosOf(itemId, fallbackPlace) : [];
  };

  const groups: CatalogGroup[] = list(row.groups)
    .filter(isObj)
    .filter((g) => g.kind === "dish" || g.kind === "drink")
    .sort((x, y) => (num(x.position) ?? 0) - (num(y.position) ?? 0))
    .map((g) => ({
      id: str(g.handle) || str(g.id),
      kind: g.kind as CatalogGroup["kind"],
      name: text(g.name),
      position: num(g.position) ?? 0,
    }));
  const groupHandle = (groupId: unknown) => {
    const raw = str(groupId);
    if (!raw) return undefined;
    const g = list(row.groups).filter(isObj).find((x) => str(x.id) === raw);
    return g ? str(g.handle) || str(g.id) : undefined;
  };

  const rooms: Room[] = byKind("room_type").map((i) => ({
    id: str(i.handle) || str(i.id),
    name: text(i.name),
    line: text(i.line),
    ...(textOrUndefined(i.body) ? { body: textOrUndefined(i.body) } : {}),
    ...(textOrUndefined(i.size) ? { size: textOrUndefined(i.size) } : {}),
    price: price(i, `room ${str(i.handle) || str(i.id)}`),
    maxGuests: num(i.maxGuests) ?? 1,
    photos: photosOf(i.id, "room"),
    amenities: list(i.amenities).filter(isObj).map((a) => ({ icon: str(a.icon) as Amenity["icon"], label: text(a.label) })),
  }));

  const asDish = (i: Json, label: string): Dish => {
    const handle = str(i.handle) || str(i.id);
    const photos = photosOf(i.id, "dish");
    const groupId = groupHandle(i.groupId);
    return {
      id: handle,
      name: text(i.name),
      price: price(i, `${label} ${handle}`),
      icon: str(i.icon) as IconKey,
      photo: photos[0] ?? { id: `${handle}-photo`, place: "dish", alt: text(i.name) },
      ...(photos.length ? { photos } : {}),
      ...(textOrUndefined(i.body) ? { body: textOrUndefined(i.body) } : {}),
      ...(i.signature === true ? { signature: true } : {}),
      ...(groupId ? { groupId } : {}),
    };
  };
  const dishes: Dish[] = byKind("dish").map((i) => asDish(i, "dish"));
  const drinks: Dish[] = byKind("drink").map((i) => asDish(i, "drink"));

  const activities: Activity[] = byKind("activity").map((i) => {
    const photos = itemPhotos(i.id, "activity", "gallery");
    const category = categories.find((c) => c === i.category);
    const arrangedBy = arrangedByValues.find((a) => a === i.arrangedBy);
    const handle = str(i.handle) || str(i.id);
    const whatToBring = list(i.whatToBring).map(text).filter((t) => t.en);
    const extraPrice = optionalPrice(i, `activity ${handle}`);
    return {
      ...(photos[0] ? { photo: photos[0] } : {}),
      ...(photos.length ? { photos } : {}),
      id: handle,
      name: text(i.name),
      line: text(i.line),
      distance: text(i.distance),
      icon: str(i.icon) as IconKey,
      arrange: i.arrange === true,
      ...(category ? { category } : {}),
      ...(textOrUndefined(i.duration) ? { duration: textOrUndefined(i.duration) } : {}),
      ...(extraPrice ? { price: extraPrice } : {}),
      ...(textOrUndefined(i.body) ? { body: textOrUndefined(i.body) } : {}),
      ...(whatToBring.length ? { whatToBring } : {}),
      ...(arrangedBy ? { arrangedBy } : {}),
      ...(textOrUndefined(i.goodToKnow) ? { goodToKnow: textOrUndefined(i.goodToKnow) } : {}),
    };
  });

  const services: Service[] = byKind("service").map((i) => {
    const handle = str(i.handle) || str(i.id);
    const extraPrice = optionalPrice(i, `service ${handle}`);
    return {
      id: handle,
      name: text(i.name),
      ...(extraPrice ? { price: extraPrice } : {}),
      ...(i.airport === true ? { airport: true } : {}),
    };
  });

  const roomIds = new Set(rooms.map((r) => r.id));
  const featuredRoomIds = list(s.featuredRoomHandles).map((h) => str(h)).filter((h) => roomIds.has(h));

  const stay = isObj(s.stay) ? s.stay : {};
  const dining = isObj(s.dining) ? s.dining : {};
  const host = isObj(s.host) ? s.host : {};
  const reviews = isObj(s.reviews) ? s.reviews : {};
  const address = isObj(location.address) ? location.address : {};

  const lookRow = isObj(s.look) ? s.look : {};
  const colorSet = (["auto", "day", "night"] as const).find((c) => c === lookRow.color_set) ?? "auto";
  const accent = (["forest", "clay", "ochre", "slate", "bark"] as const).find((a) => a === lookRow.accent) ?? "forest";

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
    look: { colorSet, accent },
    sections: list(s.sections).filter(isObj).map((x) => ({ id: str(x.id), visible: x.visible !== false }) as SectionSetting),
    hero: { title: text(hero.title), line: text(hero.line), photo: placed("hero", hero.photo, "hero") },
    facts: list(s.facts).filter(isObj).map((f, k) => ({ id: str(f.id, `fact-${k}`), value: text(f.value), icon: str(f.icon) as IconKey, detail: text(f.detail) })),
    moments: list(s.moments).filter(isObj).map((m, k) => ({ id: str(m.id, `moment-${k}`), caption: text(m.caption), icon: str(m.icon) as IconKey, photo: photo(m.photo, `moment-${k}`, "gallery") })),
    rooms,
    ...(featuredRoomIds.length ? { featuredRoomIds } : {}),
    ...(textOrUndefined(s.roomsLine) ? { roomsLine: textOrUndefined(s.roomsLine) } : {}),
    ...(textOrUndefined(s.seoDescription) ? { seoDescription: textOrUndefined(s.seoDescription) } : {}),
    ...(textOrUndefined(s.intro) ? { intro: textOrUndefined(s.intro) } : {}),
    ...(textOrUndefined(s.closing) ? { closing: textOrUndefined(s.closing) } : {}),
    stay: {
      checkIn: str(stay.checkIn, "14:00"),
      checkOut: str(stay.checkOut, "10:00"),
      breakfastIncluded: stay.breakfastIncluded === true,
      notes: list(stay.notes).map(text),
    },
    dining: { name: text(dining.name), photo: placed("dining", dining.photo, "dining"), dishes, ...(drinks.length ? { drinks } : {}) },
    ...(groups.length ? { groups } : {}),
    ...(galleryMedia.length ? { media: galleryMedia } : {}),
    activities,
    ...(services.length ? { services } : {}),
    host: { name: str(host.name), greeting: text(host.greeting), note: text(host.note), photo: placed("host", host.photo, "host") },
    reviews: {
      quote: text(reviews.quote),
      scores: list(reviews.scores).filter(isObj).map((x) => ({ source: str(x.source), value: str(x.value) })),
    },
  };
  return { ok: true, site };
}
