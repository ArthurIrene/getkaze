import { parseStayRequest, stayMessage, stayTarget, type ContentLocale } from "@getkaze/core";
import { loadSite } from "@/lib/render-page";
import { routing, type Locale } from "@/i18n/routing";

export async function POST(request: Request, { params }: { params: Promise<{ locale: string; site: string }> }) {
  const { locale, site } = await params;
  const formData = await request.formData();
  const { view } = await loadSite(site, locale as Locale);
  const parsed = parseStayRequest(formData);
  const target = stayTarget(parsed, view);
  const message = stayMessage(parsed, view, locale as ContentLocale);
  const url = new URL(target);
  url.searchParams.set("text", message);
  return Response.redirect(url.toString(), 303);
}