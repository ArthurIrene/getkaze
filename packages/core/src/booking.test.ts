import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addMonths,
  bookingLimits,
  bookingMessage,
  bookingTarget,
  formatStayDate,
  parseBookingRequest,
  todayIn,
  type BookingFields,
  type BookingLabels,
  type BookingRequest,
} from "./booking";
import type { SiteData } from "./site/types";

const site: Pick<SiteData, "name" | "rooms" | "bookingPayments" | "defaultCurrency" | "contacts"> = {
  name: "Test Lodge",
  defaultCurrency: "usd",
  bookingPayments: ["lodge", "momo"],
  contacts: { phone: "+250 788 000 000", whatsapp: "+250 788 111 222", email: "lodge@example.com" },
  rooms: [
    { id: "double", name: { en: "Garden Double", rw: "Icyumba cy'abantu babiri" }, line: { en: "" }, price: { rwf: 60000, usd: 45 }, maxGuests: 2, photos: [], amenities: [] },
    { id: "single", name: { en: "Garden Single" }, line: { en: "" }, price: { rwf: 45000, usd: 35 }, maxGuests: 1, photos: [], amenities: [] },
  ],
};

const today = "2026-11-12";
const good: BookingFields = {
  room: "double",
  checkIn: "2026-12-11",
  checkOut: "2026-12-14",
  adults: "2",
  children: "0",
  pay: "momo",
  name: "Anna Becker",
  note: "Late arrival",
  cur: "usd",
  via: "whatsapp",
};

const labels: BookingLabels = {
  hello: (b) => `Hello ${b}! I would like to request:`,
  room: (r) => `Room: ${r}`,
  dates: (f, t, n) => `Dates: ${f} to ${t} (${n} nights)`,
  guests: (a, c) => `Guests: ${a} adults, ${c} children`,
  total: (t, n, p) => `Quoted total: ${t} (${n} × ${p})`,
  pay: (m) => `I would like to pay by: ${m}`,
  name: (n) => `Name: ${n}`,
  note: (n) => `Note: ${n}`,
  method: (m) => ({ lodge: "At the lodge", momo: "MTN MoMo", airtel: "Airtel Money", bank: "Bank transfer" })[m],
  subject: (r, f, t) => `Booking request: ${r}, ${f} to ${t}`,
};

function parsed(fields: BookingFields): BookingRequest {
  const result = parseBookingRequest(fields, site, today);
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`);
  return result.request;
}

describe("parseBookingRequest", () => {
  it("accepts a complete request and counts the nights", () => {
    expect(parsed(good)).toEqual({
      roomId: "double",
      checkIn: "2026-12-11",
      checkOut: "2026-12-14",
      nights: 3,
      adults: 2,
      children: 0,
      pay: "momo",
      name: "Anna Becker",
      note: "Late arrival",
      currency: "usd",
      via: "whatsapp",
    });
  });

  it("reports missing fields, unknown rooms and payment methods the business does not accept", () => {
    expect(parseBookingRequest({ ...good, name: "   " }, site, today)).toMatchObject({ ok: false, error: "missing" });
    expect(parseBookingRequest({ ...good, room: "penthouse" }, site, today)).toMatchObject({ ok: false, error: "missing" });
    expect(parseBookingRequest({ ...good, pay: "bank" }, site, today)).toMatchObject({ ok: false, error: "missing" });
    expect(parseBookingRequest({ ...good, adults: "two" }, site, today)).toMatchObject({ ok: false, error: "missing" });
  });

  it("rejects past, reversed, impossible, too long and too far dates", () => {
    const dates = (checkIn: string, checkOut: string) => parseBookingRequest({ ...good, checkIn, checkOut }, site, today);
    expect(dates("2026-11-11", "2026-11-13")).toMatchObject({ ok: false, error: "dates" });
    expect(dates("2026-12-14", "2026-12-14")).toMatchObject({ ok: false, error: "dates" });
    expect(dates("2026-12-14", "2026-12-11")).toMatchObject({ ok: false, error: "dates" });
    expect(dates("2027-02-30", "2027-03-02")).toMatchObject({ ok: false, error: "dates" });
    expect(dates("2026-12-01", "2027-01-01")).toMatchObject({ ok: false, error: "dates" }); // 31 nights
    expect(dates("2028-05-13", "2028-05-14")).toMatchObject({ ok: false, error: "dates" }); // after 18 months
    expect(dates("2026-11-12", "2026-11-13").ok).toBe(true); // today is fine
  });

  it("rejects more guests than the room sleeps and says how many it sleeps", () => {
    expect(parseBookingRequest({ ...good, adults: "2", children: "1" }, site, today)).toEqual({ ok: false, error: "guests", max: 2, roomId: "double" });
    expect(parseBookingRequest({ ...good, adults: "0" }, site, today)).toMatchObject({ ok: false, error: "guests" });
  });

  it("falls back to the default currency and to WhatsApp when the business has no email", () => {
    expect(parsed({ ...good, cur: "eur" }).currency).toBe("usd");
    expect(parsed({ ...good, via: "email" }).via).toBe("email");
    const noEmail = { ...site, contacts: { ...site.contacts, email: undefined } };
    const r = parseBookingRequest({ ...good, via: "email" }, noEmail, today);
    expect(r.ok && r.request.via).toBe("whatsapp");
  });

  it("caps each field's length and strips control characters", () => {
    const r = parsed({ ...good, name: `${"A".repeat(200)}\u0007`, note: `${"n".repeat(2000)}\r\nend` });
    expect(Array.from(r.name)).toHaveLength(bookingLimits.name);
    expect(Array.from(r.note)).toHaveLength(bookingLimits.note);
    expect(parsed({ ...good, name: "Anna\u0000\u001b Becker" }).name).toBe("Anna Becker");
    expect(parsed({ ...good, note: "line 1\r\nline 2" }).note).toBe("line 1\nline 2");
    // An oversized id or date is cut to the field cap and then fails as unknown.
    expect(parseBookingRequest({ ...good, room: `double${"x".repeat(100)}` }, site, today)).toMatchObject({ ok: false });
  });
});

describe("bookingMessage", () => {
  it("writes every line with the quoted total in the chosen currency", () => {
    const { text, subject } = bookingMessage(parsed(good), site, "en", labels);
    expect(text).toBe(
      [
        "Hello Test Lodge! I would like to request:",
        "Room: Garden Double",
        "Dates: Fri, 11 Dec 2026 to Mon, 14 Dec 2026 (3 nights)",
        "Guests: 2 adults, 0 children",
        "Quoted total: USD 135 (3 × USD 45)",
        "I would like to pay by: MTN MoMo",
        "Name: Anna Becker",
        "Note: Late arrival",
      ].join("\n"),
    );
    expect(subject).toBe("Booking request: Garden Double, Fri, 11 Dec 2026 to Mon, 14 Dec 2026");
    expect(bookingMessage(parsed({ ...good, cur: "rwf" }), site, "en", labels).text).toContain("Quoted total: RWF 180,000 (3 × RWF 60,000)");
  });

  it("uses the room name in the page's language with English fallback, and leaves out an empty note", () => {
    const rw = bookingMessage(parsed({ ...good, note: "" }), site, "rw", labels).text;
    expect(rw).toContain("Room: Icyumba cy'abantu babiri");
    expect(rw).not.toContain("Note:");
    expect(bookingMessage(parsed({ ...good, room: "single", adults: "1" }), site, "rw", labels).text).toContain("Room: Garden Single");
  });

  it("caps the total message length by shortening the note", () => {
    const { text } = bookingMessage(parsed({ ...good, name: "N".repeat(80), note: "x".repeat(500) }), site, "en", {
      ...labels,
      note: (n) => `Note: ${n}${"!".repeat(2000)}`,
    });
    expect(text.length).toBeLessThanOrEqual(bookingLimits.message);
    expect(text.endsWith("…")).toBe(true);
    expect(text).toContain(`Name: ${"N".repeat(80)}`);
  });
});

describe("bookingTarget (no open redirect)", () => {
  const hostile: BookingFields = {
    ...good,
    whatsapp: "+1 555 000 0000",
    phone: "+1 555 000 0000",
    email: "attacker@evil.example",
    to: "https://evil.example",
    location: "https://evil.example",
    url: "javascript:alert(1)",
  };

  it("always goes to the business's own WhatsApp number, whatever the form holds", () => {
    const request = parsed(hostile);
    const target = bookingTarget(request, site, bookingMessage(request, site, "en", labels));
    expect(target.startsWith("https://wa.me/250788111222?text=")).toBe(true);
    expect(decodeURIComponent(target.split("?text=")[1] ?? "")).toContain("Name: Anna Becker");
    expect(target).not.toContain("evil");
    expect(target).not.toContain("1555");
  });

  it("emails only the business's own address", () => {
    const request = parsed({ ...hostile, via: "email" });
    const target = bookingTarget(request, site, bookingMessage(request, site, "en", labels));
    expect(target.startsWith("mailto:lodge@example.com?subject=")).toBe(true);
    expect(target).not.toContain("evil");
  });

  it("keeps the link short enough for every browser and messaging app", () => {
    const request = parsed({ ...good, name: "Ä".repeat(80), note: "é".repeat(500) });
    const target = bookingTarget(request, site, bookingMessage(request, site, "en", labels));
    expect(target.length).toBeLessThan(8000);
  });
});

describe("dates", () => {
  it("gives today in Kigali, adds months and formats stay dates", () => {
    expect(todayIn("Africa/Kigali", new Date("2026-11-12T22:30:00Z"))).toBe("2026-11-13");
    expect(addMonths("2026-08-31", 18)).toBe("2028-02-29");
    expect(formatStayDate("2026-12-11", "en")).toBe("Fri, 11 Dec 2026");
    expect(formatStayDate("nope", "en")).toBe("nope");
  });
});

// Core has no DOM or Node types, so reach the console through globalThis.
const consoleObject = (globalThis as unknown as { console: Record<"log" | "info" | "warn" | "error" | "debug", (...args: unknown[]) => void> }).console;

describe("no logging", () => {
  const spies: ReturnType<typeof vi.spyOn>[] = [];
  beforeEach(() => {
    for (const m of ["log", "info", "warn", "error", "debug"] as const) spies.push(vi.spyOn(consoleObject, m).mockImplementation(() => {}));
  });
  afterEach(() => spies.splice(0).forEach((s) => s.mockRestore()));

  it("parses, writes and targets a request without writing anything to the console", () => {
    const request = parsed(good);
    bookingTarget(request, site, bookingMessage(request, site, "en", labels));
    parseBookingRequest({ ...good, checkIn: "bad" }, site, today);
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });
});
