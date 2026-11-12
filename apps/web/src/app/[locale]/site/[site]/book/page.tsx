import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/site/[site]/book">) {
  const { locale, site } = await params;
  return pageMetadata("book", locale as Locale, site);
}

/** Rendered per request: the date inputs' "min" is today in Kigali, and ?room= preselects a room. */
export default async function BookPage({ params, searchParams }: PageProps<"/[locale]/site/[site]/book">) {
  const { locale, site } = await params;
  const room = (await searchParams).room;
  return renderPage("book", locale as Locale, site, { room: typeof room === "string" ? room : undefined });
}
