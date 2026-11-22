import { getTranslations } from "next-intl/server";
import { whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { PhotoSpot } from "./parts/photo";
import { Price } from "./parts/price";
import { pageHref } from "./parts/links";

/** Luxe rooms page: one block per room from SiteView, plain HTML, no JavaScript. */
export default async function LuxeRooms(props: TemplateProps) {
  const { site, locale, pages } = props;
  const t = await getTranslations("Luxe");
  const hasBook = pages.includes("book");
  return (
    <LuxePage {...props} pages={pages}>
      <div className="tl-subpage-head">
        <h1 className="tl-subpage-title">{t("roomsTitle")}</h1>
        {site.roomsLine ? <span className="tl-subpage-line">{site.roomsLine}</span> : null}
      </div>
      <ol className="tl-room-list">
        {site.rooms.map((room) => (
          <li key={room.id} id={`tl-room-${room.id}`} className="tl-room-block">
            <div className="tl-room-gallery">
              {(room.photos.length ? room.photos : [{ id: `${room.id}-ph`, alt: room.name, src: undefined }]).map((p) => (
                <div key={p.id} className="tl-frame">
                  {p.src ? (
                    <PhotoSpot photo={p} sizes="(min-width: 760px) 40vw, 85vw" />
                  ) : (
                    <div role="img" aria-label={p.alt} className="tl-ph" style={{ height: 200 }} />
                  )}
                </div>
              ))}
            </div>
            <div className="tl-room-info">
              <h2 className="tl-room-name">{room.name}</h2>
              <span className="tl-room-price"><Price price={room.price} /></span>
              <p className="tl-room-line">{room.line}</p>
              <p className="tl-room-sleeps">{t("roomsSleeps", { n: room.maxGuests })}</p>
            </div>
            <div className="tl-room-actions">
              <a
                className="tl-btn tl-btn-accent"
                href={
                  hasBook
                    ? `${pageHref("book", locale, site.linkBase)}?room=${encodeURIComponent(room.id)}`
                    : whatsAppLink(site.contacts.whatsapp, t("roomsDatesMessage", { name: site.name, room: room.name }))
                }
              >
                {t("roomsCheckDates")}
              </a>
            </div>
          </li>
        ))}
      </ol>
      <details className="tl-stay-info">
        <summary>{t("roomsStayInfo")}</summary>
        <ul>
          <li>{t("roomsCheckInOut", { in: site.stay.checkIn, out: site.stay.checkOut })}</li>
          {site.stay.notes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </LuxePage>
  );
}
