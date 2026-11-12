import { pickText, type ContentLocale, type LocalizedText } from "../i18n";
import { currencies, showPrice, type Currency, type Price } from "../money";
import { telLink } from "../contact";
import { visibleSections, type SectionId } from "../sections";
import type { AmenityIcon, IconKey, Photo, PhotoPlace, PropertyStyle, SiteData } from "./types";

/** A price in both currencies, already formatted, so a page can switch without a server trip. */
export type PriceView = Record<Currency, string>;

export type PhotoView = { id: string; place: PhotoPlace; alt: string; src?: string };

/**
 * Site data in one language, ready to display: texts picked with English
 * fallback, prices formatted, sections filtered. Every template reads this,
 * so templates hold no rules of their own.
 */
export type SiteView = {
  businessId: string;
  name: string;
  baseUrl: string;
  propertyStyle: PropertyStyle;
  /** Languages with owner content (D-029); only these get their own indexed pages. */
  languages: ContentLocale[];
  seoDescription: string;
  legalName: string;
  defaultCurrency: Currency;
  sections: SectionId[];
  contacts: { phone: string; whatsapp: string; email?: string; telHref: string };
  location: {
    mapUrl: string;
    area: string;
    distanceNote?: string;
    directions: string[];
    address: SiteData["location"]["address"];
  };
  hours: string[];
  payment: string[];
  bookingPayments: SiteData["bookingPayments"];
  hero: { title: string; line: string; photo: PhotoView };
  facts: { id: string; value: string; icon: IconKey; detail: string }[];
  moments: { id: string; caption: string; icon: IconKey; photo: PhotoView }[];
  rooms: {
    id: string;
    name: string;
    line: string;
    price: PriceView;
    /** The owner's numbers, for totals and price ranges. */
    priceValue: Price;
    maxGuests: number;
    photos: PhotoView[];
    amenities: { icon: AmenityIcon; label: string }[];
  }[];
  roomsLine: string;
  stay: { checkIn: string; checkOut: string; breakfastIncluded: boolean; notes: string[] };
  dining: {
    name: string;
    photo: PhotoView;
    dishes: { id: string; name: string; price: PriceView; icon: IconKey; photo: PhotoView }[];
  };
  activities: { id: string; name: string; line: string; distance: string; icon: IconKey; arrange: boolean }[];
  host: { name: string; greeting: string; note: string; photo: PhotoView };
  reviews: { quote: string; scores: { source: string; value: string }[] };
};

function prices(price: Price): PriceView {
  return Object.fromEntries(currencies.map((c) => [c, showPrice(price, c)])) as PriceView;
}

/** Build the view of a business site for one language. */
export function toSiteView(site: SiteData, locale: ContentLocale): SiteView {
  const t = (text: LocalizedText) => pickText(text, locale);
  const photo = (p: Photo): PhotoView => ({ id: p.id, place: p.place, alt: t(p.alt), src: p.src });

  const hasContent: Record<SectionId, boolean> = {
    hero: true,
    facts: site.facts.length > 0,
    life: site.moments.length > 0,
    rooms: site.rooms.length > 0,
    table: site.dining.dishes.length > 0,
    around: site.activities.length > 0,
    host: true,
    reviews: site.reviews.scores.length > 0 || site.reviews.quote.en.trim() !== "",
    findUs: true,
  };

  return {
    businessId: site.businessId,
    name: site.name,
    baseUrl: site.baseUrl.replace(/\/+$/, ""),
    propertyStyle: site.propertyStyle,
    languages: site.languages.includes("en") ? site.languages : ["en", ...site.languages],
    seoDescription: site.seoDescription ? t(site.seoDescription) : "",
    legalName: site.legalName,
    defaultCurrency: site.defaultCurrency,
    sections: visibleSections(site.sections, site.modulesOn, (id) => hasContent[id]),
    contacts: { ...site.contacts, telHref: telLink(site.contacts.phone) },
    location: {
      mapUrl: site.location.mapUrl,
      area: t(site.location.area),
      distanceNote: site.location.distanceNote && t(site.location.distanceNote),
      directions: site.location.directions.map(t),
      address: site.location.address,
    },
    hours: site.hours.map(t),
    payment: site.payment.map(t),
    bookingPayments: site.bookingPayments,
    hero: { title: t(site.hero.title), line: t(site.hero.line), photo: photo(site.hero.photo) },
    facts: site.facts.map((f) => ({ id: f.id, value: t(f.value), icon: f.icon, detail: t(f.detail) })),
    moments: site.moments.map((m) => ({ id: m.id, caption: t(m.caption), icon: m.icon, photo: photo(m.photo) })),
    rooms: site.rooms.map((r) => ({
      id: r.id,
      name: t(r.name),
      line: t(r.line),
      price: prices(r.price),
      priceValue: r.price,
      maxGuests: r.maxGuests,
      photos: r.photos.map(photo),
      amenities: r.amenities.map((a) => ({ icon: a.icon, label: t(a.label) })),
    })),
    roomsLine: site.roomsLine ? t(site.roomsLine) : "",
    stay: { ...site.stay, notes: site.stay.notes.map(t) },
    dining: {
      name: t(site.dining.name),
      photo: photo(site.dining.photo),
      dishes: site.dining.dishes.map((d) => ({
        id: d.id,
        name: t(d.name),
        price: prices(d.price),
        icon: d.icon,
        photo: photo(d.photo),
      })),
    },
    activities: site.activities.map((a) => ({
      id: a.id,
      name: t(a.name),
      line: t(a.line),
      distance: t(a.distance),
      icon: a.icon,
      arrange: a.arrange,
    })),
    host: { name: site.host.name, greeting: t(site.host.greeting), note: t(site.host.note), photo: photo(site.host.photo) },
    reviews: { quote: t(site.reviews.quote), scores: site.reviews.scores },
  };
}
