import { getTranslations } from "next-intl/server";
import { addMonths, bookingLimits, todayIn } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { pageHref } from "./parts/links";
import { FieldJournalPage } from "./parts/page";
import { Price } from "./parts/price";

/** Time zone of the businesses we serve (Musanze). Moves to business data with the database. */
const TIME_ZONE = "Africa/Kigali";

/**
 * "Check availability" request (D-044, launch mode; T1-Booking with
 * launchMode): a plain HTML form posted to /book/send, which builds the
 * message and redirects to the guest's own WhatsApp or email. Nothing is
 * stored. No client JavaScript: native inputs and HTML validation only.
 * With ?error= (the /book/error page) it explains what to fix instead.
 */
export default async function FieldJournalBook(props: TemplateProps) {
  const { site, locale, query = {} } = props;
  const t = await getTranslations("Book");
  if (query.error) return <BookError {...props} />;

  const today = todayIn(TIME_ZONE);
  const last = addMonths(today, bookingLimits.monthsAhead);
  const picked = site.rooms.some((r) => r.id === query.room) ? query.room : undefined;
  const maxGuests = Math.max(...site.rooms.map((r) => r.maxGuests));
  const action = `${pageHref("book", locale)}/send`;

  return (
    <FieldJournalPage {...props} className="fj-subpage">
      <div className="fj-page-head">
        <h1>{t("title")}</h1>
        <span className="fj-hand fj-page-line">{t("line")}</span>
      </div>
      <form id="fj-book" className="fj-book" method="post" action={action}>
        <fieldset className="fj-step">
          <legend className="fj-mono">{t("room")}</legend>
          <div className="fj-choices">
            {site.rooms.map((room) => (
              <label key={room.id} className="fj-choice">
                <input type="radio" name="room" value={room.id} required defaultChecked={room.id === picked} />
                <span className="fj-choice-body">
                  <b>{room.name}</b>
                  <span className="fj-choice-meta">
                    <Price price={room.price} /> · {t("sleeps", { n: room.maxGuests })}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fj-step">
          <legend className="fj-mono">{t("dates")}</legend>
          <div className="fj-pair">
            <label className="fj-field">
              <span>{t("checkIn")}</span>
              <input type="date" name="checkIn" required min={today} max={last} />
            </label>
            <label className="fj-field">
              <span>{t("checkOut")}</span>
              <input type="date" name="checkOut" required min={today} max={last} />
            </label>
          </div>
        </fieldset>

        <fieldset className="fj-step">
          <legend className="fj-mono">{t("guests")}</legend>
          <div className="fj-pair">
            <label className="fj-field">
              <span>{t("adults")}</span>
              <input type="number" name="adults" required min={1} max={maxGuests} defaultValue={Math.min(2, maxGuests)} inputMode="numeric" />
            </label>
            <label className="fj-field">
              <span>{t("children")}</span>
              <input type="number" name="children" min={0} max={bookingLimits.maxChildren} defaultValue={0} inputMode="numeric" />
            </label>
          </div>
        </fieldset>

        <fieldset className="fj-step">
          <legend className="fj-mono">{t("pay")}</legend>
          <div className="fj-choices">
            {site.bookingPayments.map((method, i) => (
              <label key={method} className="fj-choice">
                <input type="radio" name="pay" value={method} required defaultChecked={i === 0} />
                <span className="fj-choice-body">
                  <b>{t(`method.${method}`)}</b>
                  <span className="fj-choice-note fj-muted">{t(`methodNote.${method}`)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fj-step">
          <legend className="fj-mono">{t("details")}</legend>
          <label className="fj-field">
            <span>{t("name")}</span>
            <input type="text" name="name" required maxLength={bookingLimits.name} autoComplete="name" />
          </label>
          <label className="fj-field">
            <span>{t("note")}</span>
            <textarea name="note" rows={3} maxLength={bookingLimits.note} placeholder={t("notePlaceholder")} />
          </label>
        </fieldset>

        <fieldset className="fj-step">
          <legend className="fj-mono">{t("send")}</legend>
          <div className="fj-send">
            <button type="submit" name="via" value="whatsapp" className="fj-btn fj-btn-accent">
              {t("sendWhatsApp")}
            </button>
            {site.contacts.email ? (
              <button type="submit" name="via" value="email" className="fj-btn">
                {t("sendEmail")}
              </button>
            ) : null}
          </div>
          <p className="fj-send-note fj-muted">
            {t("sendNote", { name: site.name })}{" "}
            {props.pages.includes("privacy") ? <a href={pageHref("privacy", locale)}>{t("privacy")}</a> : null}
          </p>
        </fieldset>
      </form>
    </FieldJournalPage>
  );
}

/** /book/error: what to fix. Its URL carries no guest details; the browser's back button keeps the answers. */
async function BookError(props: TemplateProps) {
  const { locale, query = {} } = props;
  const t = await getTranslations("Book");
  const reason = query.error === "dates" || query.error === "guests" ? query.error : "missing";
  const max = Number(query.max) || 0;
  return (
    <FieldJournalPage {...props} className="fj-subpage">
      <div className="fj-page-head fj-book-error" role="alert">
        <h1>{t("error.title")}</h1>
        <p>{reason === "guests" ? t("error.guests", { n: max }) : t(`error.${reason}`)}</p>
        <p className="fj-muted">{t("error.back")}</p>
        <a className="fj-btn" href={pageHref("book", locale)}>
          {t("title")}
        </a>
      </div>
    </FieldJournalPage>
  );
}
