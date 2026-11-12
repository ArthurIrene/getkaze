import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { renderPage } from "@/lib/render-page";

/** Rendered per request (reads ?reason=). */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/site/[site]/book/error">) {
  const { locale, site } = await params;
  return pageMetadata("book", locale as Locale, site);
}

/** What to fix in a booking request. The URL carries only the reason, never guest details. */
export default async function BookErrorPage({ params, searchParams }: PageProps<"/[locale]/site/[site]/book/error">) {
  const { locale, site } = await params;
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return renderPage("book", locale as Locale, site, { error: one(q.reason) ?? "missing", max: one(q.max) });
}
