import { getTranslations } from "next-intl/server";
import { addMonths, bookingLimits, todayIn } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { pageHref } from "./parts/links";
import { LuxePage } from "./parts/page";
import { Price } from "./parts/price";

/** Time zone of the businesses we serve (Musanze). Moves to business data with the database. */
const TIME_ZONE = "Africa/Kigali";

/** Luxe "Check availability" request: a plain HTML form posted to /book/send, which builds the
 *  message and redirects to the guest's own WhatsApp or email. Nothing is stored. No client
 *  JavaScript: native inputs and HTML validation only. With ?error= it explains what to fix.
 */
export default async function LuxeBook(props: TemplateProps) {
  const { site, locale, query = {} } = props;
  const t = await getTranslations("Luxe");
  const b = await getTranslations("Book");
  if (query.error) return <BookError {...props} />;

  const today = todayIn(TIME_ZONE);
  const last = addMonths(today, bookingLimits.monthsAhead);
  const picked = site.rooms.some((r) => r.id === query.room) ? query.room : undefined;
  const maxGuests = Math.max(...site.rooms.map((r) => r.maxGuests));
  const action = `${pageHref("book", locale, site.linkBase)}/send`;

  return (
    <LuxePage {...props} pages={props.pages}>
      <div className="tl-subpage-head">
        <h1 className="tl-subpage-title">{t("bookTitle")}</h1>
        <span className="tl-subpage-line">{t("bookLine")}</span>
      </div>
      <form id="tl-book" className="tl-book" method="post" action={action}>
        <fieldset className="tl-step">
          <legend className="tl-mono">{b("room")}</legend>
          <div className="tl-choices">
            {site.rooms.map((room) => (
              <label key={room.id} className="tl-choice">
                <input type="radio" name="room" value={room.id} required defaultChecked={room.id === picked} />
                <span className="tl-choice-body">
                  <b>{room.name}</b>
                  <span className="tl-choice-meta">
                    <Price price={room.price} /> · {b("sleeps", { n: room.maxGuests })}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{b("dates")}</legend>
          <div className="tl-pair">
            <label className="tl-field">
              <span>{b("checkIn")}</span>
              <input type="date" name="checkIn" required min={today} max={last} />
            </label>
            <label className="tl-field">
              <span>{b("checkOut")}</span>
              <input type="date" name="checkOut" required min={today} max={last} />
            </label>
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{b("guests")}</legend>
          <div className="tl-pair">
            <label className="tl-field">
              <span>{b("adults")}</span>
              <input type="number" name="adults" required min={1} max={maxGuests} defaultValue={Math.min(2, maxGuests)} inputMode="numeric" />
            </label>
            <label className="tl-field">
              <span>{b("children")}</span>
              <input type="number" name="children" min={0} max={bookingLimits.maxChildren} defaultValue={0} inputMode="numeric" />
            </label>
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{b("pay")}</legend>
          <div className="tl-choices">
            {site.bookingPayments.map((method, i) => (
              <label key={method} className="tl-choice">
                <input type="radio" name="pay" value={method} required defaultChecked={i === 0} />
                <span className="tl-choice-body">
                  <b>{b(`method.${method}`)}</b>
                  <span className="tl-choice-note tl-muted">{b(`methodNote.${method}`)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{b("details")}</legend>
          <label className="tl-field">
            <span>{b("name")}</span>
            <input type="text" name="name" required maxLength={bookingLimits.name} autoComplete="name" />
          </label>
          <label className="tl-field">
            <span>{b("note")}</span>
            <textarea name="note" rows={3} maxLength={bookingLimits.note} placeholder={b("notePlaceholder")} />
          </label>
        </fieldset>

        <fieldset className="tl-step">
          <legend className="tl-mono">{b("send")}</legend>
          <div className="tl-send">
            <button type="submit" name="via" value="whatsapp" className="tl-btn tl-btn-accent">
              {t("bookSendWhatsApp")}
            </button>
            {site.contacts.email ? (
              <button type="submit" name="via" value="email" className="tl-btn">
                {t("bookSendEmail")}
              </button>
            ) : null}
          </div>
          <p className="tl-send-note tl-muted">
            {t("bookSendNote", { name: site.name })} {props.pages.includes("privacy") ? (
              <a href={pageHref("privacy", locale, site.linkBase)}>{t("bookPrivacy")}</a>
            ) : null}
          </p>
        </fieldset>
      </form>
    </LuxePage>
  );
}

/** /book/error: what to fix. Its URL carries no guest details; the browser's back button keeps the answers. */
async function BookError(props: TemplateProps) {
  const { site, locale, query = {} } = props;
  const b = await getTranslations("Book");
  const reason = query.error === "dates" || query.error === "guests" ? query.error : "missing";
  const max = Number(query.max) || 0;
  return (
    <LuxePage {...props} pages={props.pages}>
      <div className="tl-subpage-head tl-book-error" role="alert">
        <h1 className="tl-subpage-title">{b("error.title")}</h1>
        <p>{reason === "guests" ? b("error.guests", { n: max }) : b(`error.${reason}`)}</p>
        <p className="tl-muted">{b("error.back")}</p>
        <a className="tl-btn" href={pageHref("book", locale, site.linkBase)}>
          {b("title")}
        </a>
      </div>
    </LuxePage>
  );
}
