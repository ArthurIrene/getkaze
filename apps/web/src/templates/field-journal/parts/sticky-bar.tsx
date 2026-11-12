import { getTranslations } from "next-intl/server";
import { whatsAppLink, type PageId, type SiteView } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";
import { Glyph } from "./icons";
import { checkHref } from "./links";

/**
 * "Check availability" opens the request form (D-044) when the site has it,
 * otherwise WhatsApp with a prefilled message. The second button is Call, or
 * WhatsApp on pages that follow the rooms mockup.
 */
export async function StickyBar({
  site,
  locale,
  pages,
  second = "call",
}: {
  site: SiteView;
  locale: Locale;
  pages: PageId[];
  second?: "call" | "whatsapp";
}) {
  const t = await getTranslations("FieldJournal");
  return (
    <div className="fj-bar">
      <a className="fj-bar-main" href={checkHref(site, locale, pages, t("checkMessage", { name: site.name }))}>
        {t("check")}
      </a>
      {second === "call" ? (
        <a className="fj-bar-call" href={site.contacts.telHref} aria-label={t("call")}>
          <Glyph name="call" size={20} />
        </a>
      ) : (
        <a className="fj-bar-call" href={whatsAppLink(site.contacts.whatsapp)} aria-label={t("whatsapp")}>
          <Glyph name="chat" size={20} />
        </a>
      )}
    </div>
  );
}
