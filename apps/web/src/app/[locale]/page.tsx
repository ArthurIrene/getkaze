import type { Metadata } from "next";
import { toSiteView } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import type { Locale } from "@/i18n/routing";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const view = toSiteView(await getSite(), locale);
  return { title: view.name, description: `${view.hero.title} ${view.hero.line}` };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // The layout already rejects unknown locales with a 404.
  return renderPage("home", (await params).locale as Locale);
}
