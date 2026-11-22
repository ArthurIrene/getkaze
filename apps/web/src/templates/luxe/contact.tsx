import { getTranslations } from "next-intl/server";
import { mailLink, whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";

/** Luxe contact page: Call, WhatsApp and email, address, getting here, hours, payment, map link. Read only, no JavaScript. */
export default async function LuxeContact(props: TemplateProps) {
  const { site } = props;
  const t = await getTranslations("Luxe");
  const { phone, whatsapp, email, telHref } = site.contacts;
  const blocks: { id: string; label: string; lines: string[] }[] = [
    { id: "address", label: t("contactAddress"), lines: [site.location.area] },
    { id: "here", label: t("contactGettingHere"), lines: site.location.directions },
    { id: "hours", label: t("contactHours"), lines: site.hours },
    { id: "payment", label: t("contactPayment"), lines: site.payment },
  ].filter((b) => b.lines.length > 0);
  return (
    <LuxePage {...props} pages={props.pages}>
      <div className="tl-subpage-head">
        <h1 className="tl-subpage-title">{t("contactTitle")}</h1>
        <span className="tl-subpage-line">{t("contactLine")}</span>
      </div>
      <div className="tl-contact">
        <div className="tl-contact-main">
          <ul className="tl-contact-buttons tl-rise">
            <li>
              <a className="tl-contact-btn" href={telHref}>
                <span className="tl-contact-glyph">&#9742;</span>
                <span>
                  <b>{t("contactCallUs")}</b>
                  <span className="tl-mono">{phone}</span>
                </span>
              </a>
            </li>
            <li>
              <a className="tl-contact-btn tl-contact-accent" href={whatsAppLink(whatsapp, t("contactHelloMessage", { name: site.name }))}>
                <span className="tl-contact-glyph">&#9993;</span>
                <span>
                  <b>{t("contactWhatsAppUs")}</b>
                  <span className="tl-mono">{whatsapp}</span>
                </span>
              </a>
            </li>
            {email ? (
              <li>
                <a className="tl-contact-btn" href={mailLink(email)}>
                  <span className="tl-contact-glyph">&#9993;</span>
                  <span>
                    <b>{t("contactEmailUs")}</b>
                    <span className="tl-mono tl-lower">{email}</span>
                  </span>
                </a>
              </li>
            ) : null}
          </ul>
          {blocks.map((b) => (
            <section key={b.id} className="tl-contact-block tl-rise" aria-labelledby={`tl-c-${b.id}`}>
              <h2 id={`tl-c-${b.id}`} className="tl-mono">{b.label}</h2>
              <ul>
                {b.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="tl-contact-map">
          <a className="tl-btn" href={site.location.mapUrl} target="_blank" rel="noopener">
            {t("contactOpenMaps")}
          </a>
        </div>
      </div>
    </LuxePage>
  );
}
