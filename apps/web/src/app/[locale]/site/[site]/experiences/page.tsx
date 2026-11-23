import type { Locale } from "@/i18n/routing";
import { loadSite, renderPage } from "@/lib/render-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  const { view } = await loadSite(site, locale);
  return {
    title: "Experiences | " + view.name,
    description: "Experiences and activities around the lodge.",
  };
}

export default async function ExperiencesPage({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  return renderPage("experiences", locale, site);
}