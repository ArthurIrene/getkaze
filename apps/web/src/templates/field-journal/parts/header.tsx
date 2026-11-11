import { getTranslations } from "next-intl/server";
import type { SiteView } from "@getkaze/core";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/** Name, language links (plain links, no JavaScript) and the CSS-only RWF/USD switch. */
export async function Header({ site, locale }: { site: SiteView; locale: Locale }) {
  const t = await getTranslations("FieldJournal");
  return (
    <header className="fj-header">
      <span className="fj-logo">{site.name}</span>
      <div className="fj-header-tools">
        <nav aria-label={t("language")} className="fj-pills">
          {routing.locales.map((code) => (
            <a
              key={code}
              href={getPathname({ href: "/", locale: code })}
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
          <input type="radio" name="fj-cur" id="fj-cur-rwf" defaultChecked={site.defaultCurrency === "rwf"} />
          <label htmlFor="fj-cur-rwf">RWF</label>
          <input type="radio" name="fj-cur" id="fj-cur-usd" defaultChecked={site.defaultCurrency === "usd"} />
          <label htmlFor="fj-cur-usd">USD</label>
        </fieldset>
      </div>
    </header>
  );
}
