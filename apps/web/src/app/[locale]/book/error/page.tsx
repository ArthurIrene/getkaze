import type { Locale } from "@/i18n/routing";
import { renderPage } from "@/lib/render-page";

/** What to fix in a booking request. The URL carries only the reason, never guest details. */
export default async function BookErrorPage({ params, searchParams }: PageProps<"/[locale]/book/error">) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return renderPage("book", (await params).locale as Locale, { error: one(q.reason) ?? "missing", max: one(q.max) });
}
