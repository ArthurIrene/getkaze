import { pagePaths, whatsAppLink, type PageId, type SiteView } from "@getkaze/core";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Luxe-only page paths (extends core pagePaths). */
const luxePagePaths: Record<string, string> = {
  ...pagePaths,
  myStay: "/my-stay",
};

/** Localised path of a page inside the current Luxe site. Links only to pages Luxe renders. */
export function pageHref(page: PageId | "myStay", locale: Locale, base = "", hash?: string): string {
  const path = getPathname({ href: luxePagePaths[page], locale });
  const full = base ? (path === "/" ? base : `${base}${path}`) : path;
  return hash ? `${full}#${hash}` : full;
}

/** The stay request when the site has a book page, otherwise WhatsApp (never an unbuilt page). */
export function checkHref(site: SiteView, locale: Locale, pages: PageId[], message: string): string {
  return pages.includes("book") ? pageHref("book", locale, site.linkBase) : whatsAppLink(site.contacts.whatsapp, message);
}
