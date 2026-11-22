import { getTranslations } from "next-intl/server";
import { type PageId, type SiteView } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";
import { checkHref } from "./links";
import { Glyph } from "./icons";

/** "Check availability" (WhatsApp when Luxe has no book page yet) plus a Call button. Stuck to the bottom. */
export async function StickyBar({
  site,
  locale,
  pages,
}: {
  site: SiteView;
  locale: Locale;
  pages: PageId[];
}) {
  const t = await getTranslations("Luxe");
  const check = checkHref(site, locale, pages, t("checkMessage", { name: site.name }));
  return (
    <div className="tl-bar">
      <a className="tl-bar-call" href={site.contacts.telHref} aria-label={t("call")}>
        <Glyph name="call" size={20} />
        <span className="tl-bar-label">{t("call")}</span>
      </a>
      <a className="tl-bar-main" href={check}>
        {t("check")}
      </a>
      <a className="tl-bar-wa" href={site.contacts.whatsapp ? `https://wa.me/${site.contacts.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(t("checkMessage", { name: site.name }))}` : site.contacts.telHref} aria-label={t("whatsapp")}>
        <Glyph name="chat" size={20} />
        <span className="tl-bar-label">{t("whatsapp")}</span>
      </a>
    </div>
  );
}
