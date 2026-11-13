import { getTranslations } from "next-intl/server";
import { menuPages, whatsAppLink, type PageId, type SiteView } from "@getkaze/core";
import { routing, type Locale } from "@/i18n/routing";
import { Glyph } from "./icons";
import { checkHref, pageHref } from "./links";

type HeaderProps = { site: SiteView; locale: Locale; page: PageId; pages: PageId[] };

/**
 * Name (links home), language links to the same page (plain links), the
 * CSS-only RWF/USD switch, and the site menu (Rooms, Contact): a <details>
 * on phones, inline links on desktop. Sticky on every page. "Check
 * availability" and a compact WhatsApp button are here on desktop only;
 * phones have the bottom bar. No JavaScript.
 */
export async function Header({ site, locale, page, pages }: HeaderProps) {
  const t = await getTranslations("FieldJournal");
  const n = await getTranslations("Nav");
  const links = menuPages(pages);
  const check = checkHref(site, locale, pages, t("checkMessage", { name: site.name }));
  // On the booking request the currency radios belong to the form, so the quoted total uses the guest's choice.
  const curForm = page === "book" ? "fj-book" : undefined;
  const curName = page === "book" ? "cur" : "fj-cur";
  const items = links.map((id) => (
    <li key={id}>
      <a href={pageHref(id, locale, site.linkBase)} aria-current={id === page ? "page" : undefined}>
        {n(id)}
      </a>
    </li>
  ));
  return (
    <header className="fj-header">
      <a className="fj-logo" href={pageHref("home", locale, site.linkBase)}>
        {site.name}
      </a>
      <nav aria-label={n("site")} className="fj-nav-inline">
        <ul>{items}</ul>
        <a className="fj-nav-check" href={check}>
          {t("check")}
        </a>
        <a className="fj-nav-wa" href={whatsAppLink(site.contacts.whatsapp)} aria-label={t("whatsapp")}>
          <Glyph name="chat" size={18} />
        </a>
      </nav>
      <div className="fj-header-tools">
        <nav aria-label={t("language")} className="fj-pills">
          {routing.locales.map((code) => (
            <a
              key={code}
              href={pageHref(page, code, site.linkBase)}
              hrefLang={code}
              lang={code}
              aria-current={code === locale ? "page" : undefined}
            >
              {code.toUpperCase()}
            </a>
          ))}
        </nav>
        <fieldset className="fj-pills fj-cur">
          <legend className="fj-sr">{t("currency")}</legend>
          <input type="radio" name={curName} form={curForm} id="fj-cur-rwf" value="rwf" defaultChecked={site.defaultCurrency === "rwf"} />
          <label htmlFor="fj-cur-rwf">RWF</label>
          <input type="radio" name={curName} form={curForm} id="fj-cur-usd" value="usd" defaultChecked={site.defaultCurrency === "usd"} />
          <label htmlFor="fj-cur-usd">USD</label>
        </fieldset>
        <details className="fj-menu">
          <summary aria-label={n("menu")}>
            <span className="fj-burger" aria-hidden="true" />
          </summary>
          <nav aria-label={n("site")} className="fj-menu-panel fj-fade">
            <ul>{items}</ul>
            <span className="fj-hand fj-menu-welcome">{t("welcome")}</span>
          </nav>
        </details>
      </div>
    </header>
  );
}
