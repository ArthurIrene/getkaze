import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/site/[site]/contact">) {
  const { locale, site } = await params;
  return pageMetadata("contact", locale as Locale, site);
}

export default async function Page({ params }: PageProps<"/[locale]/site/[site]/contact">) {
  const { locale, site } = await params;
  return renderPage("contact", locale as Locale, site);
}
