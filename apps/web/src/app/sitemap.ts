import type { MetadataRoute } from "next";
import { indexedLocales, localePath } from "@getkaze/core";
import { routing } from "@/i18n/routing";
import { availablePages } from "@/lib/render-page";
import { siteForHost } from "@/lib/site-for-host";

/**
 * /sitemap.xml (specs/seo-basics.md): every page in every translated
 * language, with hreflang alternates. Pages stay noindex until G2 (D-054).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const found = await siteForHost();
  if (!found) return [];
  const { site, view } = found;
  const locales = indexedLocales(view.languages, routing.locales);
  const pages = availablePages(site.template, view);
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${view.baseUrl}${localePath(page, locale)}`,
      alternates: locales.length > 1 ? { languages: Object.fromEntries(locales.map((l) => [l, `${view.baseUrl}${localePath(page, l)}`])) } : undefined,
    })),
  );
}
