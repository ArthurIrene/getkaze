import type { ContentLocale, LocalizedText } from "../i18n";
import type { Currency, Price } from "../money";
import type { ModuleId } from "../modules";
import type { SectionSetting } from "../sections";
import type { PaymentMethod } from "../booking";

/** Property style of a Hotel/Lodge business (D-043): sets wording and structured data type. */
export type PropertyStyle = "lodge" | "townHotel" | "guesthouse";

/** Templates a business can use (D-039, D-040). Imigongo and Cinematic come later. */
export const templateIds = ["field-journal"] as const;
export type TemplateId = (typeof templateIds)[number];

/**
 * Picture keys. Data names the subject; each template draws it its own way,
 * so the same data works with every template.
 */
export type IconKey =
  | "park"
  | "breakfast"
  | "permit"
  | "coffee"
  | "fire"
  | "garden"
  | "stars"
  | "trek"
  | "monkey"
  | "cave"
  | "lake"
  | "village"
  | "grill"
  | "stew";

/** Where a photo is shown (DATA.md, Photos). */
export type PhotoPlace = "hero" | "room" | "dining" | "dish" | "host" | "gallery";

/** A photo. Without `src` the template shows a placeholder. */
export type Photo = {
  id: string;
  place: PhotoPlace;
  alt: LocalizedText;
  src?: string;
  /** Sizes made on the owner's device (480/960/1440 px), for <img srcset>. */
  srcset?: string;
  width?: number;
  height?: number;
};

export type Fact = { id: string; value: LocalizedText; icon: IconKey; detail: LocalizedText };

export type Moment = { id: string; caption: LocalizedText; icon: IconKey; photo: Photo };

/** Amenity icons on the rooms page (T1-Rooms). */
export type AmenityIcon = "bed" | "people" | "shower" | "wifi" | "view" | "fire" | "desk";

export type Amenity = { icon: AmenityIcon; label: LocalizedText };

/** A room type (catalog item). Units for availability arrive with the booking system. */
export type Room = {
  id: string;
  name: LocalizedText;
  line: LocalizedText;
  price: Price;
  maxGuests: number;
  photos: Photo[];
  amenities: Amenity[];
};

/** Check-in, check-out and stay notes (rooms page fold, structured data). Times as "HH:MM". */
export type Stay = {
  checkIn: string;
  checkOut: string;
  breakfastIncluded: boolean;
  notes: LocalizedText[];
};

export type Dish = { id: string; name: LocalizedText; price: Price; icon: IconKey; photo: Photo };

export type Activity = {
  id: string;
  name: LocalizedText;
  line: LocalizedText;
  distance: LocalizedText;
  icon: IconKey;
  /** Shows "Ask us to arrange" (D-042). */
  arrange: boolean;
};

export type ReviewScore = { source: string; value: string };

/**
 * Everything a guest site template reads for one business. Templates only
 * read it (CLAUDE.md rule 4). No guest data lives here.
 */
export type SiteData = {
  businessId: string;
  name: string;
  /** Public address of the site, e.g. "https://kinigihills.rw" (no trailing slash). Canonical URLs and the sitemap use it. */
  baseUrl: string;
  propertyStyle: PropertyStyle;
  /** Shown in the footer copyright. */
  legalName: string;
  template: TemplateId;
  /** The RWF/USD switch starts on this currency. */
  defaultCurrency: Currency;
  /** Languages with owner content. English is always on. */
  languages: ContentLocale[];
  modulesOn: ModuleId[];
  contacts: {
    /** With country code, e.g. "+250 788 123 456". */
    phone: string;
    whatsapp: string;
    email?: string;
  };
  location: {
    mapUrl: string;
    area: LocalizedText;
    /** Short note on the map drawing, e.g. "Musanze 25'". */
    distanceNote?: LocalizedText;
    /** "Getting here" lines on the contact page. */
    directions: LocalizedText[];
    /** Structured address for search engines. Country as ISO code, e.g. "RW". */
    address: { locality: string; region: string; country: string };
  };
  hours: LocalizedText[];
  payment: LocalizedText[];
  /** Payment choices offered on the booking request (D-045). */
  bookingPayments: PaymentMethod[];
  sections: SectionSetting[];
  hero: { title: LocalizedText; line: LocalizedText; photo: Photo };
  facts: Fact[];
  moments: Moment[];
  rooms: Room[];
  /** Owner's search description for the home page (optional; otherwise one is built). */
  seoDescription?: LocalizedText;
  /** Handwritten line under "Rooms", e.g. "four rooms, one view". */
  roomsLine?: LocalizedText;
  stay: Stay;
  dining: { name: LocalizedText; photo: Photo; dishes: Dish[] };
  activities: Activity[];
  host: { name: string; greeting: LocalizedText; note: LocalizedText; photo: Photo };
  reviews: { quote: LocalizedText; scores: ReviewScore[] };
};
