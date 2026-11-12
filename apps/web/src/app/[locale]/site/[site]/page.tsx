import { jsonLdText, lodgingJsonLd } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { loadSite, renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/site/[site]">) {
  const { locale, site } = await params;
  return pageMetadata("home", locale as Locale, site);
}

export default async function HomePage({ params }: PageProps<"/[locale]/site/[site]">) {
  const { locale, site } = await params;
  const { view } = await loadSite(site, locale as Locale);
  return (
    <>
      {/* Structured data (data, not executable script): specs/seo-basics.md. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(lodgingJsonLd(view)) }} />
      {await renderPage("home", locale as Locale, site)}
    </>
  );
}
