import { getTranslations } from "next-intl/server";
import { whatsAppLink, type AmenityIcon } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { FieldJournalPage } from "./parts/page";
import { pageHref } from "./parts/links";
import { Price } from "./parts/price";

/** Amenity line icons (24 × 24, from mockups/canvas/T1-Rooms.dc.html). */
const amenityIcons: Record<AmenityIcon, string> = {
  bed: "M3 18 V8 M3 14 H21 V18 M21 14 V12 a3 3 0 0 0 -3 -3 H11 V14 M5 11 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0",
  shower: "M8 4 H16 V7 M12 7 V8 M9 11 v2 M12 11 v3 M15 11 v2 M10 16 v2 M14 16 v2",
  view: "M4 4 H20 V20 H4 Z M4 12 H20 M6 18 L10 13 L13 16 L16 12 L19 18",
  wifi: "M3 9 a13 13 0 0 1 18 0 M6 12.5 a8.5 8.5 0 0 1 12 0 M9 16 a4 4 0 0 1 6 0 M12 19.5 v0.1",
  fire: "M12 21 C6 21 6 14 9.5 11 C9.5 14 12 14 12 11.5 C12 8 14.5 6 14.5 3.5 C18 8 19 11 17 15.5 C16 19 14.5 21 12 21 Z",
  people: "M9 11 a3 3 0 1 0 0 -6 a3 3 0 1 0 0 6 M3 20 a6 6 0 0 1 12 0 M16 11 a2.5 2.5 0 1 0 0 -5 M15 14 a5 5 0 0 1 6 6",
  desk: "M3 9 H21 M5 9 V19 M19 9 V19 M14 9 V14 H19",
};

/** Placeholder drawings for a room's photo frames: bed, view, bathroom (64 × 64). */
const frameDrawings = [
  "M8 44 V24 M8 36 H56 V44 M56 36 V30 a6 6 0 0 0 -6 -6 H26 V36 M12 30 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0",
  "M12 12 H52 V52 H12 Z M12 32 H52 M16 48 L26 36 L32 42 L40 30 L48 48",
  "M20 14 H40 V20 M30 20 V22 M22 30 v4 M30 30 v6 M38 30 v4 M26 40 v4 M34 40 v4 M14 52 H50",
];

/**
 * Rooms page (mockups/canvas/T1-Rooms.dc.html): per room a swipe gallery,
 * name and price, amenity icons, "More +" (the room's line) and "Check
 * dates"; then check-in, children and payment on tap. No JavaScript.
 */
export default async function FieldJournalRooms(props: TemplateProps) {
  const { site, locale, pages } = props;
  const t = await getTranslations("Rooms");
  const hasBook = pages.includes("book");
  return (
    <FieldJournalPage {...props} bar="whatsapp" className="fj-subpage">
      <div className="fj-page-head">
        <h1>{t("title")}</h1>
        {site.roomsLine ? <span className="fj-hand fj-page-line">{site.roomsLine}</span> : null}
        <div className="fj-chips">
          <span className="fj-chip fj-mono">{t("perNight")}</span>
          {site.stay.breakfastIncluded ? <span className="fj-chip fj-mono">{t("breakfast")}</span> : null}
        </div>
      </div>
      <ol className="fj-room-list">
        {site.rooms.map((room, i) => (
          <li key={room.id} id={`room-${room.id}`} className="fj-room-block fj-rise">
            <div className="fj-gallery">
              <ul className="fj-row fj-gallery-row">
                {(room.photos.length ? room.photos : [{ id: `${room.id}-ph`, alt: room.name, src: undefined }]).map((p, j) => (
                  <li key={p.id} className="fj-frame">
                    {p.src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- plain img: no Vercel image optimizer (D-035)
                      <img src={p.src} alt={p.alt} loading="lazy" decoding="async" className="fj-photo" />
                    ) : (
                      <div role="img" aria-label={p.alt} className="fj-photo fj-ph">
                        <svg viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">
                          <path d={frameDrawings[j % frameDrawings.length]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <span className="fj-no fj-mono">{t("number", { n: i + 1 })}</span>
            </div>
            <div className="fj-room-title">
              <h2>{room.name}</h2>
              <span className="fj-room-price">
                <Price price={room.price} />
              </span>
            </div>
            {room.amenities.length > 0 ? (
              <ul className="fj-amen">
                {room.amenities.map((a) => (
                  <li key={a.icon + a.label}>
                    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                      <path d={amenityIcons[a.icon]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="fj-mono">{a.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="fj-room-more fj-fade">
              <p className="fj-hand">{room.line}</p>
              <p className="fj-muted">{t("sleeps", { n: room.maxGuests })}</p>
            </div>
            <div className="fj-room-actions">
              <details className="fj-more">
                <summary>
                  <span className="fj-more-open">{t("more")}</span>
                  <span className="fj-more-close">{t("less")}</span>
                </summary>
              </details>
              <a
                className="fj-btn fj-btn-accent"
                href={
                  hasBook
                    ? `${pageHref("book", locale)}?room=${encodeURIComponent(room.id)}`
                    : whatsAppLink(site.contacts.whatsapp, t("datesMessage", { name: site.name, room: room.name }))
                }
              >
                {t("checkDates")}
              </a>
            </div>
          </li>
        ))}
      </ol>
      <details className="fj-info fj-stay">
        <summary>{t("stayInfo")}</summary>
        <ul className="fj-fade">
          <li>{t("checkInOut", { in: site.stay.checkIn, out: site.stay.checkOut })}</li>
          {site.stay.notes.map((line) => <li key={line}>{line}</li>)}
          {site.payment.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </details>
    </FieldJournalPage>
  );
}
