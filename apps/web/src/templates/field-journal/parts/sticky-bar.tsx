import { getTranslations } from "next-intl/server";
import { whatsAppLink, type SiteView } from "@getkaze/core";
import { Glyph } from "./icons";

/**
 * "Check availability" opens WhatsApp with a prefilled message until the
 * booking form ships (D-044, weeks 3–5).
 */
export async function StickyBar({ site }: { site: SiteView }) {
  const t = await getTranslations("FieldJournal");
  return (
    <div className="fj-bar">
      <a className="fj-bar-main" href={whatsAppLink(site.contacts.whatsapp, t("checkMessage", { name: site.name }))}>
        {t("check")}
      </a>
      <a className="fj-bar-call" href={site.contacts.telHref} aria-label={t("call")}>
        <Glyph name="call" size={20} />
      </a>
    </div>
  );
}
