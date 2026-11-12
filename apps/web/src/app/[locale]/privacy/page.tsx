import type { Locale } from "@/i18n/routing";
import { renderPage } from "@/lib/render-page";

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  return renderPage("privacy", (await params).locale as Locale);
}
