import { pagePaths, whatsAppLink, type PageId, type SiteView } from "@getkaze/core";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Localised path of a page inside the current site: "/rooms" or "/rw/rooms",
 * with the site's link base in front on the fallback ("/s/<slug>/rw/rooms").
 */
export function pageHref(page: PageId, locale: Locale, base = "", hash?: string): string {
  const path = getPathname({ href: pagePaths[page], locale });
  const full = base ? (path === "/" ? base : `${base}${path}`) : path;
  return hash ? `${full}#${hash}` : full;
}

/**
 * "Check availability": the request form when the site has it (D-044),
 * otherwise WhatsApp with a prefilled message.
 */
export function checkHref(site: SiteView, locale: Locale, pages: PageId[], message: string): string {
  return pages.includes("book") ? pageHref("book", locale, site.linkBase) : whatsAppLink(site.contacts.whatsapp, message);
}
