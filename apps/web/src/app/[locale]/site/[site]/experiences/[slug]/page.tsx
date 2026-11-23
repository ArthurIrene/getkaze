import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/site/[site]/experiences/[slug]">) {
  const { locale, site } = await params;
  return pageMetadata("experienceDetail", locale as Locale, site);
}

export default async function Page({ params }: PageProps<"/[locale]/site/[site]/experiences/[slug]">) {
  const { locale, site, slug } = await params;
  return renderPage("experienceDetail", locale as Locale, site, { slug: String(slug) });
}
