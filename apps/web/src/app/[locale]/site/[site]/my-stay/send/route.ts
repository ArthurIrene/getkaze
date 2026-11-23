import { parseStayRequest, stayMessage, stayTarget, type ContentLocale } from "@getkaze/core";
import { loadSite } from "@/lib/render-page";
import { notFound } from "next/navigation";
import { type Locale } from "@/i18n/routing";

export async function POST(request: Request, { params }: { params: Promise<{ locale: string; site: string }> }) {
  const { locale, site } = await params;
  const { site: siteData, view } = await loadSite(site, locale as Locale);
  if (siteData.template !== "luxe") notFound();

  const formData = await request.formData();
  const parsed = parseStayRequest(formData);

  if (!parsed.item || !parsed.group || !parsed.checkIn || !parsed.checkOut || !parsed.name) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (parsed.checkOut <= parsed.checkIn) {
    return new Response(JSON.stringify({ error: "Check-out must be after check-in" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const target = stayTarget(parsed, view);
  const message = stayMessage(parsed, view, locale as ContentLocale);
  const url = new URL(target);
  url.searchParams.set("text", message);
  return Response.redirect(url.toString(), 303);
}
