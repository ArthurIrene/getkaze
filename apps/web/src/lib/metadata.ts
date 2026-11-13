import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageSeo, type PageId, type SeoLabels } from "@getkaze/core";
import { loadSite } from "@/lib/render-page";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Title, description, canonical, hreflang alternates and Open Graph for a
 * page (specs/seo-basics.md), built by packages/core. robots stays
 * "noindex, nofollow" from the layout until G2 (D-054).
 */
export async function pageMetadata(page: PageId, locale: Locale, siteKey: string): Promise<Metadata> {
  const { view } = await loadSite(siteKey, locale);
  const t = await getTranslations({ locale, namespace: "Seo" });
  const n = await getTranslations({ locale, namespace: "Nav" });
  const p = await getTranslations({ locale, namespace: "Privacy" });
  const labels: SeoLabels = {
    style: (style) => t(`style.${style}`),
    homeTitle: (v) => t("homeTitle", v),
    pageTitle: (v) => t("pageTitle", v),
    pageName: (id) => (id === "privacy" ? p("title") : n(id)),
    homeDescription: (v) => t("homeDescription", v),
    roomsDescription: (v) => t("roomsDescription", { ...v, breakfast: v.breakfast ? "yes" : "no" }),
    contactDescription: (v) => t("contactDescription", v),
    bookDescription: (v) => t("bookDescription", v),
    privacyDescription: (v) => t("privacyDescription", v),
    creditsDescription: (v) => t("creditsDescription", v),
  };
  const seo = pageSeo(page, view, locale, routing.locales, labels);
  return {
    metadataBase: new URL(view.baseUrl),
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical, ...(Object.keys(seo.alternates).length ? { languages: seo.alternates } : {}) },
    openGraph: {
      type: "website",
      siteName: view.name,
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      locale: seo.ogLocale,
      alternateLocale: seo.ogLocaleAlternates,
      ...(view.hero.photo.src ? { images: [{ url: view.hero.photo.src, alt: view.hero.photo.alt }] } : {}),
    },
    twitter: { card: "summary", title: seo.title, description: seo.description },
  };
}
