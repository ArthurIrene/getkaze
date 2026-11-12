import { jsonLdText, lodgingJsonLd, toSiteView } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  return pageMetadata("home", (await params).locale as Locale);
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // The layout already rejects unknown locales with a 404.
  const locale = (await params).locale as Locale;
  const view = toSiteView(await getSite(), locale);
  return (
    <>
      {/* Structured data (data, not executable script): specs/seo-basics.md. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(lodgingJsonLd(view)) }} />
      {await renderPage("home", locale)}
    </>
  );
}
