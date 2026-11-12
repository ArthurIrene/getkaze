import { pagePaths, whatsAppLink, type PageId, type SiteView } from "@getkaze/core";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Localised path of a page: "/rooms" in English, "/rw/rooms" in Kinyarwanda. */
export function pageHref(page: PageId, locale: Locale, hash?: string): string {
  const path = getPathname({ href: pagePaths[page], locale });
  return hash ? `${path}#${hash}` : path;
}

/**
 * "Check availability": the request form when the site has it (D-044),
 * otherwise WhatsApp with a prefilled message.
 */
export function checkHref(site: SiteView, locale: Locale, pages: PageId[], message: string): string {
  return pages.includes("book") ? pageHref("book", locale) : whatsAppLink(site.contacts.whatsapp, message);
}
