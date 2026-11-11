import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { toSiteView } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import type { Locale } from "@/i18n/routing";
import { homeTemplates } from "@/templates/registry";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const view = toSiteView(await getSite(), locale);
  return { title: view.name, description: `${view.hero.title} ${view.hero.line}` };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // The layout already rejects unknown locales with a 404.
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const site = await getSite();
  const Template = homeTemplates[site.template];
  return <Template site={toSiteView(site, locale)} locale={locale} />;
}
