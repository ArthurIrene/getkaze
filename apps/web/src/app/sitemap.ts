import type { MetadataRoute } from "next";
import { indexedLocales, localePath, toSiteView } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import { routing } from "@/i18n/routing";
import { availablePages } from "@/lib/render-page";

/**
 * /sitemap.xml (specs/seo-basics.md): every page in every translated
 * language, with hreflang alternates. Pages stay noindex until G2 (D-054).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const view = toSiteView(site, "en");
  const locales = indexedLocales(view.languages, routing.locales);
  const pages = availablePages(site.template, view);
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${view.baseUrl}${localePath(page, locale)}`,
      alternates: locales.length > 1 ? { languages: Object.fromEntries(locales.map((l) => [l, `${view.baseUrl}${localePath(page, l)}`])) } : undefined,
    })),
  );
}
