import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import {
  bookingMessage,
  bookingTarget,
  parseBookingRequest,
  todayIn,
  type BookingFields,
  type BookingLabels,
  type PaymentMethod,
} from "@getkaze/core";
import { getSite } from "@/data/get-site";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * POST /book/send (booking-request.md, D-044 launch mode).
 * Builds the request message in packages/core and answers 303 to the
 * guest's own WhatsApp (wa.me) or email (mailto:). The target is built
 * only from the business's stored number and email, never from the form.
 *
 * Privacy (D-033, D-049): nothing is stored, and nothing about the guest is
 * logged. Do not add logging here (ESLint no-console is on for this file).
 */
const MAX_BODY = 8 * 1024;

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

export async function POST(request: Request, { params }: RouteContext<"/[locale]/book/send">) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const errorPath = (reason: string, max?: number) =>
    `${getPathname({ href: "/book/error", locale })}?reason=${reason}${max ? `&max=${max}` : ""}`;

  let fields: BookingFields = {};
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY) return seeOther(errorPath("missing"));
    const form = await request.formData();
    for (const [key, value] of form) if (typeof value === "string" && !(key in fields)) fields[key] = value;
  } catch {
    fields = {};
  }

  const site = await getSite();
  const parsed = parseBookingRequest(fields, site, todayIn("Africa/Kigali"));
  if (!parsed.ok) return seeOther(errorPath(parsed.error, parsed.max));

  const t = await getTranslations({ locale, namespace: "Book.msg" });
  const m = await getTranslations({ locale, namespace: "Book.method" });
  const labels: BookingLabels = {
    hello: (business) => t("hello", { business }),
    room: (room) => t("room", { room }),
    dates: (from, to, nights) => t("dates", { from, to, nights }),
    guests: (adults, children) => t("guests", { adults, children }),
    total: (total, nights, price) => t("total", { total, nights, price }),
    pay: (method) => t("pay", { method }),
    name: (name) => t("name", { name }),
    note: (note) => t("note", { note }),
    method: (method: PaymentMethod) => m(method),
    subject: (room, from, to) => t("subject", { room, from, to }),
  };
  const message = bookingMessage(parsed.request, site, locale, labels);
  return seeOther(bookingTarget(parsed.request, site, message));
}

/** Anything but POST goes back to the form. */
export async function GET(_request: Request, { params }: RouteContext<"/[locale]/book/send">) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return seeOther(getPathname({ href: "/book", locale }));
}
