import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  return pageMetadata("privacy", (await params).locale as Locale);
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  return renderPage("privacy", (await params).locale as Locale);
}
