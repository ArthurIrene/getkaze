import type { ContentLocale } from "./i18n";
import { formatPrice, type Currency } from "./money";
import { pagePaths, type PageId } from "./pages";
import type { SiteView } from "./site/view";
import type { PropertyStyle } from "./site/types";

/**
 * SEO basics (specs/seo-basics.md). noindex stays on every page until G2
 * (D-054); these rules make the pages ready for the day it is removed.
 */

/** Path of a page in a language, as routed: English has no prefix (localePrefix "as-needed"). */
export function localePath(page: PageId, locale: string, defaultLocale = "en"): string {
  const path = pagePaths[page];
  if (locale === defaultLocale) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

/**
 * Languages that get their own indexed pages (D-029): the business's
 * translated languages that the site can route, English first.
 */
export function indexedLocales(languages: readonly ContentLocale[], routed: readonly string[]): string[] {
  const set = new Set<string>(["en", ...languages.filter((l) => routed.includes(l))]);
  return [...set];
}

/** Shorten to at most `max` characters at a word boundary, adding "…" when cut. */
export function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** The lowest room price in a currency, formatted ("USD 35"), or "" without rooms. */
export function lowestRoomPrice(rooms: { priceValue: Record<Currency, number> }[], currency: Currency): string {
  if (rooms.length === 0) return "";
  return formatPrice(Math.min(...rooms.map((r) => r.priceValue[currency])), currency);
}

/** "USD 35–75" for structured data. */
export function priceRange(rooms: { priceValue: Record<Currency, number> }[], currency: Currency): string {
  if (rooms.length === 0) return "";
  const values = rooms.map((r) => r.priceValue[currency]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const lowText = formatPrice(low, currency);
  return low === high ? lowText : `${lowText}–${formatPrice(high, currency).replace(/^[A-Z]{3} /, "")}`;
}

export type SeoLabels = {
  style: (style: PropertyStyle) => string;
  homeTitle: (v: { name: string; style: string; locality: string; region: string }) => string;
  pageTitle: (v: { page: string; name: string }) => string;
  pageName: (page: Exclude<PageId, "home">) => string;
  homeDescription: (v: { title: string; style: string; area: string; price: string }) => string;
  roomsDescription: (v: { count: number; price: string; breakfast: boolean }) => string;
  contactDescription: (v: { name: string; area: string; hours: string }) => string;
  bookDescription: (v: { name: string }) => string;
  privacyDescription: (v: { name: string }) => string;
};

export type PageSeo = {
  title: string;
  description: string;
  canonical: string;
  /** hreflang → absolute URL, including x-default; empty when only one language is indexed. */
  alternates: Record<string, string>;
  ogLocale: string;
  ogLocaleAlternates: string[];
};

const ogLocales: Record<string, string> = { en: "en_US", rw: "rw_RW", fr: "fr_FR" };

export function pageSeo(
  page: PageId,
  view: SiteView & { rooms: { priceValue: Record<Currency, number> }[] },
  locale: string,
  routed: readonly string[],
  labels: SeoLabels,
): PageSeo {
  const indexed = indexedLocales(view.languages, routed);
  const url = (l: string) => `${view.baseUrl}${localePath(page, l)}`;
  const canonical = indexed.includes(locale) ? url(locale) : url("en");
  const alternates: Record<string, string> = {};
  if (indexed.length > 1) {
    for (const l of indexed) alternates[l] = url(l);
    alternates["x-default"] = url("en");
  }
  const style = labels.style(view.propertyStyle);
  const price = lowestRoomPrice(view.rooms, view.defaultCurrency);
  const { name } = view;

  let title: string;
  let description: string;
  switch (page) {
    case "home":
      title = labels.homeTitle({ name, style, locality: view.location.address.locality, region: view.location.address.region });
      description =
        view.seoDescription ||
        labels.homeDescription({ title: `${view.hero.title} ${view.hero.line}`.trim(), style, area: view.location.area, price });
      break;
    case "rooms":
      description = labels.roomsDescription({ count: view.rooms.length, price, breakfast: view.stay.breakfastIncluded });
      title = labels.pageTitle({ page: labels.pageName(page), name });
      break;
    case "contact":
      description = labels.contactDescription({ name, area: view.location.area, hours: view.hours[0] ?? "" });
      title = labels.pageTitle({ page: labels.pageName(page), name });
      break;
    case "book":
      description = labels.bookDescription({ name });
      title = labels.pageTitle({ page: labels.pageName(page), name });
      break;
    case "privacy":
      description = labels.privacyDescription({ name });
      title = labels.pageTitle({ page: labels.pageName(page), name });
      break;
  }

  const shownLocale = indexed.includes(locale) ? locale : "en";
  return {
    title,
    description: clip(description),
    canonical,
    alternates,
    ogLocale: ogLocales[shownLocale] ?? shownLocale,
    ogLocaleAlternates: indexed.filter((l) => l !== shownLocale).map((l) => ogLocales[l] ?? l),
  };
}

const schemaTypes: Record<PropertyStyle, string> = {
  lodge: "LodgingBusiness",
  townHotel: "Hotel",
  guesthouse: "BedAndBreakfast",
};

/** schema.org structured data for the home page. Only real photos become images. */
export function lodgingJsonLd(view: SiteView & { rooms: { priceValue: Record<Currency, number> }[] }): Record<string, unknown> {
  const images = [view.hero.photo, ...view.rooms.flatMap((r) => r.photos)]
    .map((p) => p.src)
    .filter((src): src is string => Boolean(src))
    .map((src) => (src.startsWith("http") ? src : `${view.baseUrl}${src}`));
  return {
    "@context": "https://schema.org",
    "@type": schemaTypes[view.propertyStyle],
    name: view.name,
    url: `${view.baseUrl}/`,
    telephone: view.contacts.phone,
    ...(view.contacts.email ? { email: view.contacts.email } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: view.location.address.locality,
      addressRegion: view.location.address.region,
      addressCountry: view.location.address.country,
    },
    hasMap: view.location.mapUrl,
    checkinTime: view.stay.checkIn,
    checkoutTime: view.stay.checkOut,
    ...(view.rooms.length ? { priceRange: priceRange(view.rooms, view.defaultCurrency) } : {}),
    ...(images.length ? { image: images } : {}),
    containsPlace: view.rooms.map((r) => ({
      "@type": "HotelRoom",
      name: r.name,
      occupancy: { "@type": "QuantitativeValue", maxValue: r.maxGuests },
    })),
  };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so it can never close the tag. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
