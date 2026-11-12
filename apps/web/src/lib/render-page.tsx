import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { parseSiteKey, sitePages, toSiteView, type PageId, type SiteData, type SiteView } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import type { Locale } from "@/i18n/routing";
import { templates } from "@/templates/registry";

/** Pages this site has that its template implements. */
export function availablePages(template: keyof typeof templates, view: Parameters<typeof sitePages>[0]): PageId[] {
  const pages = templates[template];
  return sitePages(view).filter((id) => id in pages);
}

/** The site and its view for a route key (from the proxy), or a clean 404. */
export async function loadSite(siteKey: string, locale: Locale): Promise<{ site: SiteData; view: SiteView }> {
  const key = parseSiteKey(siteKey);
  if (!key) notFound();
  const site = await getSite(key);
  if (!site) notFound();
  return { site, view: { ...toSiteView(site, locale), linkBase: key.base } };
}

/** Shared page entry: load the business, pick the template page, 404 if the site has no such page. */
export async function renderPage(page: PageId, locale: Locale, siteKey: string, query?: Record<string, string | undefined>) {
  setRequestLocale(locale);
  const { site, view } = await loadSite(siteKey, locale);
  const pages = availablePages(site.template, view);
  const Page = templates[site.template][page];
  if (!Page || !pages.includes(page)) notFound();
  return <Page site={view} locale={locale} page={page} pages={pages} query={query} />;
}
