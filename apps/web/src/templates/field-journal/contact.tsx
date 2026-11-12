import { getTranslations } from "next-intl/server";
import { mailLink, whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { Glyph } from "./parts/icons";
import { MapCard } from "./parts/map";
import { FieldJournalPage } from "./parts/page";

/**
 * Contact page (specs/contact-page.md; no mockup, wireframe approved in the
 * spec): Call, WhatsApp and email buttons, the drawn map linking to Google
 * Maps, address, getting here, hours and payment. Read only, no JavaScript.
 */
export default async function FieldJournalContact(props: TemplateProps) {
  const { site } = props;
  const t = await getTranslations("Contact");
  const f = await getTranslations("FieldJournal");
  const { phone, whatsapp, email, telHref } = site.contacts;
  const blocks: { id: string; label: string; lines: string[] }[] = [
    { id: "address", label: t("address"), lines: [site.location.area] },
    { id: "here", label: t("gettingHere"), lines: site.location.directions },
    { id: "hours", label: t("hours"), lines: site.hours },
    { id: "payment", label: t("payment"), lines: site.payment },
  ].filter((b) => b.lines.length > 0);
  return (
    <FieldJournalPage {...props} className="fj-subpage">
      <div className="fj-page-head">
        <h1>{t("title")}</h1>
        <span className="fj-hand fj-page-line">{t("line")}</span>
      </div>
      <div className="fj-contact">
        <div className="fj-contact-main">
          <ul className="fj-contact-buttons fj-rise">
            <li>
              <a className="fj-contact-btn" href={telHref}>
                <Glyph name="call" />
                <span>
                  <b>{t("callUs")}</b>
                  <span className="fj-mono">{phone}</span>
                </span>
              </a>
            </li>
            <li>
              <a className="fj-contact-btn fj-contact-accent" href={whatsAppLink(whatsapp, t("helloMessage", { name: site.name }))}>
                <Glyph name="chat" />
                <span>
                  <b>{t("whatsappUs")}</b>
                  <span className="fj-mono">{whatsapp}</span>
                </span>
              </a>
            </li>
            {email ? (
              <li>
                <a className="fj-contact-btn" href={mailLink(email)}>
                  <Glyph name="mail" />
                  <span>
                    <b>{t("emailUs")}</b>
                    <span className="fj-mono fj-lower">{email}</span>
                  </span>
                </a>
              </li>
            ) : null}
          </ul>
          {blocks.map((b) => (
            <section key={b.id} className="fj-contact-block fj-rise" aria-labelledby={`fj-c-${b.id}`}>
              <h2 id={`fj-c-${b.id}`} className="fj-mono">
                {b.label}
              </h2>
              <ul>
                {b.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="fj-contact-map">
          <MapCard site={site} label={`${t("openMaps")}: ${site.location.area}`} here={f("here")} />
          <a className="fj-btn" href={site.location.mapUrl}>
            {t("openMaps")}
            <Glyph name="out" size={18} />
          </a>
        </div>
      </div>
    </FieldJournalPage>
  );
}
