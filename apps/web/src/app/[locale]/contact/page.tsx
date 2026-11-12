import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  return pageMetadata("contact", (await params).locale as Locale);
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  return renderPage("contact", (await params).locale as Locale);
}
