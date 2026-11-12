import { whatsAppLink, mailLink } from "./contact";
import { pickText, type ContentLocale } from "./i18n";
import { currencies, formatPrice, priceIn, type Currency } from "./money";
import type { SiteData } from "./site/types";

/**
 * Booking request, launch mode (D-044): the guest's own WhatsApp or email
 * delivers the request; nothing is stored or logged (D-033, D-049).
 * Pure functions only, so the server route is a thin wrapper.
 */

/** Ways a guest can choose to pay (D-045). The business picks which it accepts. */
export const paymentMethods = ["lodge", "momo", "airtel", "bank"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

/** Caps on what a guest can send. The message cap keeps wa.me and mailto links well within URL limits. */
export const bookingLimits = {
  name: 80,
  note: 500,
  /** Any other field (ids, dates, numbers, choices). */
  field: 40,
  /** The whole message text. */
  message: 1200,
  maxNights: 30,
  monthsAhead: 18,
  maxChildren: 10,
} as const;

export type BookingVia = "whatsapp" | "email";

export type BookingRequest = {
  roomId: string;
  /** YYYY-MM-DD */
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  pay: PaymentMethod;
  name: string;
  note: string;
  currency: Currency;
  via: BookingVia;
};

export type BookingError = "missing" | "dates" | "guests";

export type BookingParse =
  | { ok: true; request: BookingRequest }
  | { ok: false; error: BookingError; max?: number; roomId?: string };

/** Raw form fields, as strings. Unknown fields are ignored. */
export type BookingFields = Record<string, string | undefined>;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's date (YYYY-MM-DD) in a time zone; the business is in Africa/Kigali. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function dayNumber(iso: string): number | null {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / 86_400_000;
}

/** The date `months` months after an ISO date (day clamped to the month's end). */
export function addMonths(iso: string, months: number): string {
  const m = ISO_DATE.exec(iso)!;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1 + months;
  const target = new Date(Date.UTC(y, mo, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(Number(m[3]), last));
  return target.toISOString().slice(0, 10);
}

/** Remove control characters (keeping new lines in the note), trim, and cap the length. */
function clean(value: string | undefined, max: number, keepNewLines = false): string {
  const raw = (value ?? "").slice(0, max * 4);
  const noControls = keepNewLines
    ? raw.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : raw.replace(/[\u0000-\u001F\u007F]/g, " ");
  const tidy = keepNewLines ? noControls.replace(/\n{3,}/g, "\n\n") : noControls.replace(/\s+/g, " ");
  return Array.from(tidy.trim()).slice(0, max).join("").trim();
}

function int(value: string | undefined): number | null {
  const v = clean(value, bookingLimits.field);
  return /^\d{1,3}$/.test(v) ? Number(v) : null;
}

/** Check a submitted request against the business's rooms and settings. */
export function parseBookingRequest(
  fields: BookingFields,
  site: Pick<SiteData, "rooms" | "bookingPayments" | "defaultCurrency" | "contacts">,
  today: string,
): BookingParse {
  const roomId = clean(fields.room, bookingLimits.field);
  const room = site.rooms.find((r) => r.id === roomId);
  const name = clean(fields.name, bookingLimits.name);
  const checkIn = clean(fields.checkIn, bookingLimits.field);
  const checkOut = clean(fields.checkOut, bookingLimits.field);
  const payValue = clean(fields.pay, bookingLimits.field);
  const pay = site.bookingPayments.find((p) => p === payValue);
  const adults = int(fields.adults);
  const children = fields.children === undefined || clean(fields.children, bookingLimits.field) === "" ? 0 : int(fields.children);

  if (!room || !name || !checkIn || !checkOut || !pay || adults === null || children === null) {
    return { ok: false, error: "missing", roomId: room?.id };
  }

  const inDay = dayNumber(checkIn);
  const outDay = dayNumber(checkOut);
  const todayDay = dayNumber(today);
  const lastDay = dayNumber(addMonths(today, bookingLimits.monthsAhead));
  if (inDay === null || outDay === null || todayDay === null || lastDay === null) return { ok: false, error: "dates", roomId: room.id };
  const nights = outDay - inDay;
  if (inDay < todayDay || inDay > lastDay || nights < 1 || nights > bookingLimits.maxNights) {
    return { ok: false, error: "dates", roomId: room.id };
  }

  if (adults < 1 || children > bookingLimits.maxChildren || adults + children > room.maxGuests) {
    return { ok: false, error: "guests", max: room.maxGuests, roomId: room.id };
  }

  const curValue = clean(fields.cur, bookingLimits.field);
  const currency = currencies.find((c) => c === curValue) ?? site.defaultCurrency;
  const via: BookingVia = clean(fields.via, bookingLimits.field) === "email" && site.contacts.email ? "email" : "whatsapp";

  return {
    ok: true,
    request: {
      roomId: room.id,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      pay,
      name,
      note: clean(fields.note, bookingLimits.note, true),
      currency,
      via,
    },
  };
}

/** Wording for the message, supplied by the app's translation files (core stays free of i18n libraries). */
export type BookingLabels = {
  hello: (business: string) => string;
  room: (room: string) => string;
  dates: (from: string, to: string, nights: number) => string;
  guests: (adults: number, children: number) => string;
  total: (total: string, nights: number, price: string) => string;
  pay: (method: string) => string;
  name: (name: string) => string;
  note: (note: string) => string;
  method: (method: PaymentMethod) => string;
  subject: (room: string, from: string, to: string) => string;
};

/** "Fri, 11 Dec 2026" in the page's language (Kinyarwanda through CLDR, e.g. "Gnu., 11 Uku. 2026"). */
export function formatStayDate(iso: string, locale: ContentLocale): string {
  const day = dayNumber(iso);
  if (day === null) return iso;
  const tag = locale === "en" ? "en-GB" : locale;
  return new Intl.DateTimeFormat(tag, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(day * 86_400_000),
  );
}

/** The request text. Lines stay short; the note is shortened so the whole message fits the cap. */
export function bookingMessage(
  request: BookingRequest,
  site: Pick<SiteData, "name" | "rooms">,
  locale: ContentLocale,
  labels: BookingLabels,
): { subject: string; text: string } {
  const room = site.rooms.find((r) => r.id === request.roomId)!;
  const roomName = pickText(room.name, locale);
  const from = formatStayDate(request.checkIn, locale);
  const to = formatStayDate(request.checkOut, locale);
  const price = priceIn(room.price, request.currency);
  const lines = [
    labels.hello(site.name),
    labels.room(roomName),
    labels.dates(from, to, request.nights),
    labels.guests(request.adults, request.children),
    labels.total(formatPrice(price * request.nights, request.currency), request.nights, formatPrice(price, request.currency)),
    labels.pay(labels.method(request.pay)),
    labels.name(request.name),
  ];
  let text = lines.join("\n");
  if (request.note) {
    const room = bookingLimits.message - text.length - 1;
    const full = labels.note(request.note);
    const noteLine = full.length <= room ? full : `${Array.from(full).slice(0, Math.max(0, room - 1)).join("")}…`;
    if (room > 1) text = `${text}\n${noteLine}`;
  }
  if (text.length > bookingLimits.message) text = `${Array.from(text).slice(0, bookingLimits.message - 1).join("")}…`;
  return { subject: labels.subject(roomName, from, to), text };
}

/**
 * Where to send the guest: always built from the business's own WhatsApp
 * number or email, never from anything in the form (no open redirect).
 */
export function bookingTarget(
  request: Pick<BookingRequest, "via">,
  site: Pick<SiteData, "contacts">,
  message: { subject: string; text: string },
): string {
  if (request.via === "email" && site.contacts.email) {
    return mailLink(site.contacts.email, message.subject, message.text);
  }
  return whatsAppLink(site.contacts.whatsapp, message.text);
}
