import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { Price } from "../parts/price";

/** Rooms: one card per room type with photo, name, line and price. */
export async function Rooms({ site }: TemplateProps) {
  const t = await getTranslations("Luxe");
  return (
    <section className="tl-section tl-rooms" aria-labelledby="tl-rooms">
      <h2 id="tl-rooms" className="tl-section-title">{t("rooms")}</h2>
      <ul className="tl-grid">
        {site.rooms.map((room, i) => {
          const [first] = room.photos;
          return (
            <li key={room.id} className="tl-room">
              {i === 0 && first ? <PhotoSpot photo={first} sizes="(min-width: 760px) 50vw, 100vw" /> : <div className="tl-ph" aria-label={room.name} style={{ height: 180 }} />}
              <span className="tl-tag"><Price price={room.price} /></span>
              <h3 className="tl-room-name">{room.name}</h3>
              <p className="tl-room-line">{room.line}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
