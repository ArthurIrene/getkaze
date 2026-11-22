import { getTranslations } from "next-intl/server";
import { type PageId, type SiteView } from "@getkaze/core";
import { routing, type Locale } from "@/i18n/routing";
import { pageHref } from "./links";

type HeaderProps = { site: SiteView; locale: Locale; page: PageId; pages: PageId[] };

/** Name (links home), the top menu (Rooms and Contact only), language pills and the RWF/USD switch. No JavaScript. */
export async function Header({ site, locale, page, pages }: HeaderProps) {
  const t = await getTranslations("Luxe");
  const n = await getTranslations("Nav");
  // Top menu lists only Rooms and Contact; Book lives in the sticky bar, Privacy in the footer.
  const menuIds: PageId[] = ["rooms", "contact"];
  const links = menuIds.filter((id) => pages.includes(id) && id !== page);
  const items = links.map((id) => (
    <li key={id}>
      <a href={pageHref(id, locale, site.linkBase)} aria-current={id === page ? "page" : undefined}>
        {n(id)}
      </a>
    </li>
  ));
  return (
    <header className="tl-header">
      <a className="tl-logo" href={pageHref("home", locale, site.linkBase)}>
        {site.name}
      </a>
      {items.length > 0 ? (
        <nav aria-label={n("site")} className="tl-nav-inline">
          <ul>{items}</ul>
        </nav>
      ) : null}
      <div className="tl-header-tools">
        <nav aria-label={t("language")} className="tl-pills">
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
        <fieldset className="tl-pills tl-cur">
          <legend className="tl-sr">{t("currency")}</legend>
          <input type="radio" name="tl-cur" id="tl-cur-rwf" value="rwf" defaultChecked={site.defaultCurrency === "rwf"} />
          <label htmlFor="tl-cur-rwf">RWF</label>
          <input type="radio" name="tl-cur" id="tl-cur-usd" value="usd" defaultChecked={site.defaultCurrency === "usd"} />
          <label htmlFor="tl-cur-usd">USD</label>
        </fieldset>
      </div>
    </header>
  );
}
