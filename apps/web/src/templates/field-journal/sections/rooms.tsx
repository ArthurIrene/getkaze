import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { pageHref } from "../parts/links";
import { PhotoSpot } from "../parts/photo";
import { Price } from "../parts/price";

/** Rooms: one card per room type with its price. Cards open the rooms page at that room. */
export async function Rooms({ site, locale, pages }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  const r = await getTranslations("Rooms");
  const hasPage = pages.includes("rooms");
  return (
    <section aria-labelledby="fj-rooms">
      <div className="fj-head fj-rise">
        <h2 id="fj-rooms">{t("rooms")}</h2>
        {hasPage ? (
          <a className="fj-head-link" href={pageHref("rooms", locale)}>
            {r("allRooms")}
          </a>
        ) : null}
      </div>
      <ul className="fj-row fj-grid">
        {site.rooms.map((room) => {
          const [first] = room.photos;
          const card = (
            <>
              <div className="fj-room-pic">
                {first ? <PhotoSpot photo={first} /> : <div className="fj-photo fj-ph" style={{ height: 300 }} />}
                <span className="fj-tag">
                  <Price price={room.price} />
                </span>
              </div>
              <span className="fj-room-name">{room.name}</span>
            </>
          );
          return (
            <li key={room.id} className="fj-room">
              {hasPage ? (
                <a className="fj-room-link" href={pageHref("rooms", locale, `room-${room.id}`)}>
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
