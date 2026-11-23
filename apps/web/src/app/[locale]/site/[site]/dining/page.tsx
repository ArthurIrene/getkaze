import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  return pageMetadata("dining", locale as Locale, site);
}

export default async function Page({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  return renderPage("dining", locale as Locale, site);
}
