import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

/** Rendered per request: the date inputs' "min" is today in Kigali, and ?room= preselects a room. */
export async function generateMetadata({ params }: PageProps<"/[locale]/book">) {
  return pageMetadata("book", (await params).locale as Locale);
}

export default async function BookPage({ params, searchParams }: PageProps<"/[locale]/book">) {
  const room = (await searchParams).room;
  return renderPage("book", (await params).locale as Locale, { room: typeof room === "string" ? room : undefined });
}
