import { getTranslations } from "next-intl/server";
import { whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../../types";
import { Glyph } from "../parts/icons";
import { pageHref } from "../parts/links";
import { MapCard } from "../parts/map";

/** Find us: map drawing, Directions / Call / WhatsApp, hours and payment on tap. */
export async function FindUs({ site, locale, pages }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  const c = await getTranslations("Contact");
  return (
    <section className="fj-find fj-rise" aria-labelledby="fj-find">
      <div className="fj-find-head">
        <h2 id="fj-find">{t("findUs")}</h2>
        {pages.includes("contact") ? (
          <a className="fj-head-link" href={pageHref("contact", locale)}>
            {c("allDetails")}
          </a>
        ) : null}
      </div>
      <MapCard site={site} label={`${t("directions")}: ${site.location.area}`} here={t("here")} />
      <ul className="fj-actions">
        <li>
          <a href={site.location.mapUrl}>
            <span><Glyph name="pin" /></span>
            {t("directions")}
          </a>
        </li>
        <li>
          <a href={site.contacts.telHref}>
            <span><Glyph name="call" /></span>
            {t("call")}
          </a>
        </li>
        <li className="fj-accent">
          <a href={whatsAppLink(site.contacts.whatsapp)}>
            <span><Glyph name="chat" /></span>
            {t("whatsapp")}
          </a>
        </li>
      </ul>
      <details className="fj-info">
        <summary>{t("hoursPayment")}</summary>
        <ul className="fj-fade">
          {site.hours.map((line) => <li key={line}>{line}</li>)}
          {site.payment.map((line) => <li key={line}>{line}</li>)}
          <li className="fj-muted">{site.location.area}</li>
        </ul>
      </details>
    </section>
  );
}
