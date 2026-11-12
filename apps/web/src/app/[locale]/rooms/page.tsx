import type { Locale } from "@/i18n/routing";
import { renderPage } from "@/lib/render-page";

export default async function RoomsPage({ params }: PageProps<"/[locale]/rooms">) {
  return renderPage("rooms", (await params).locale as Locale);
}
