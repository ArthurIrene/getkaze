import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { parseSiteKey, sitePages, toSiteView, type PageId, type SiteData, type SiteView, type TemplateId } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import type { Locale } from "@/i18n/routing";
import type { TemplateProps } from "@/templates/types";
import { templates } from "@/templates/registry";
import { luxePageIds } from "@/templates/luxe/pages";

/** Pages this site has that its template implements. */
export function availablePages(template: TemplateId, view: Parameters<typeof sitePages>[0]): PageId[] {
  if (template === "luxe") {
    const base = sitePages(view).filter((id) => luxePageIds.includes(id));
    // Luxe-only pages (excluded from sitePages by the core template) are added here.
    for (const id of luxePageIds) {
      if (!base.includes(id)) base.push(id);
    }
    return base;
  }
  const pages = templates[template];
  if (pages) {
    return sitePages(view).filter((id) => id in pages);
  }
  return [];
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
  let Page: ComponentType<TemplateProps> | undefined;
  if (site.template === "luxe") {
    // Function-level dynamic import: Field Journal sites never load Luxe code,
    // and each Luxe page loads only its own module (zero Luxe JS on other pages).
    const mod = await importPage(page);
    Page = mod?.default as ComponentType<TemplateProps> | undefined;
  } else {
    Page = templates[site.template]?.[page];
  }
  const pages = availablePages(site.template, view);
  if (!Page || !pages.includes(page)) notFound();
  return <Page site={view} locale={locale} page={page} pages={pages} query={query} />;
}

/** One dynamic import per Luxe page, keyed by page id. Each page is its own chunk. */
async function importPage(page: PageId): Promise<{ default: unknown } | undefined> {
  switch (page) {
    case "home":
      return await import("@/templates/luxe/home");
    case "rooms":
      return await import("@/templates/luxe/rooms");
    case "contact":
      return await import("@/templates/luxe/contact");
    case "book":
      return await import("@/templates/luxe/book");
    case "privacy":
      return await import("@/templates/luxe/privacy");
    case "myStay":
      return await import("@/templates/luxe/my-stay");
    case "experiences":
      return await import("@/templates/luxe/experiences");
    case "experienceDetail":
      return await import("@/templates/luxe/experience-detail");
    case "dining":
      return await import("@/templates/luxe/dining");
    default:
      return undefined;
  }
}
