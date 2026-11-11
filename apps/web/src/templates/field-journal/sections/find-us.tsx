import { getTranslations } from "next-intl/server";
import { whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../../types";
import { Glyph } from "../parts/icons";

/** Find us: map drawing, Directions / Call / WhatsApp, hours and payment on tap. */
export async function FindUs({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section className="fj-find fj-rise" aria-labelledby="fj-find">
      <h2 id="fj-find">{t("findUs")}</h2>
      <a className="fj-map" href={site.location.mapUrl} aria-label={`${t("directions")}: ${site.location.area}`}>
        <svg viewBox="0 0 328 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M0 156 Q90 124 160 138 T328 106" fill="none" stroke="var(--line)" strokeWidth="12" strokeLinecap="round" />
          <path d="M156 138 Q166 92 206 66" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeDasharray="5 5" />
          <path d="M236 48 l18 -26 l18 26 M266 52 l13 -18 l13 18" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="206" cy="66" r="10" fill="var(--accent)" />
          <circle cx="206" cy="66" r="4" fill="var(--paper)" />
        </svg>
        <span className="fj-hand fj-map-here">{t("here")}</span>
        {site.location.distanceNote ? <span className="fj-mono fj-map-note">← {site.location.distanceNote}</span> : null}
      </a>
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
