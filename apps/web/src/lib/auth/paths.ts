import { getPathname } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

/** A platform path in the visitor's language: "/owner" or "/rw/owner". */
export function platformHref(path: string, locale: string): string {
  const l: Locale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  return getPathname({ href: path, locale: l });
}

/** The site's own origin for links in emails: from the request host, never from user input. */
export function requestOrigin(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const proto = headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
