import type { Locale } from "@/i18n/routing";
import { renderPage } from "@/lib/render-page";

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  return renderPage("contact", (await params).locale as Locale);
}
