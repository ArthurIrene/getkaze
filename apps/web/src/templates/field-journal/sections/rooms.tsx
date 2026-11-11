import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { Price } from "../parts/price";

/** Rooms: one card per room type with its price. Cards link to the rooms page in part 2. */
export async function Rooms({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section aria-labelledby="fj-rooms">
      <div className="fj-head fj-rise">
        <h2 id="fj-rooms">{t("rooms")}</h2>
      </div>
      <ul className="fj-row fj-grid">
        {site.rooms.map((room) => {
          const [first] = room.photos;
          return (
            <li key={room.id} className="fj-room">
              <div className="fj-room-pic">
                {first ? <PhotoSpot photo={first} /> : <div className="fj-photo fj-ph" style={{ height: 300 }} />}
                <span className="fj-tag">
                  <Price price={room.price} />
                </span>
              </div>
              <span className="fj-room-name">{room.name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
