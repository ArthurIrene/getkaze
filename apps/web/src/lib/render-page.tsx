import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { sitePages, toSiteView, type PageId } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import type { Locale } from "@/i18n/routing";
import { templates } from "@/templates/registry";

/** Pages this site has that its template implements. */
export function availablePages(template: keyof typeof templates, view: Parameters<typeof sitePages>[0]): PageId[] {
  const pages = templates[template];
  return sitePages(view).filter((id) => id in pages);
}

/** Shared page entry: load the business, pick the template page, 404 if the site has no such page. */
export async function renderPage(page: PageId, locale: Locale, query?: Record<string, string | undefined>) {
  setRequestLocale(locale);
  const site = await getSite();
  const view = toSiteView(site, locale);
  const pages = availablePages(site.template, view);
  const Page = templates[site.template][page];
  if (!Page || !pages.includes(page)) notFound();
  return <Page site={view} locale={locale} page={page} pages={pages} query={query} />;
}
