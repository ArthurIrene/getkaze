import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/rooms">) {
  return pageMetadata("rooms", (await params).locale as Locale);
}

export default async function RoomsPage({ params }: PageProps<"/[locale]/rooms">) {
  return renderPage("rooms", (await params).locale as Locale);
}
