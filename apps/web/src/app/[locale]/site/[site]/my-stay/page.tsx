import type { Locale } from "@/i18n/routing";
import { loadSite, renderPage } from "@/lib/render-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  const { view } = await loadSite(site, locale);
  return {
    title: "Your stay plan | " + view.name,
    description: "Review and send your stay plan via WhatsApp.",
  };
}

export default async function MyStayPage({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  return renderPage("myStay", locale, site);
}