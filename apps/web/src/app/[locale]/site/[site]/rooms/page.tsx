import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/site/[site]/rooms">) {
  const { locale, site } = await params;
  return pageMetadata("rooms", locale as Locale, site);
}

export default async function Page({ params }: PageProps<"/[locale]/site/[site]/rooms">) {
  const { locale, site } = await params;
  return renderPage("rooms", locale as Locale, site);
}
