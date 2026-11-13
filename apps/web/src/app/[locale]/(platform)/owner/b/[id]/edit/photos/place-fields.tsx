import { getTranslations } from "next-intl/server";
import { photoPlaces } from "@getkaze/core";

/** Where a photo shows: hero, a room, dining, host, gallery. A room photo picks its room. */
export async function PlaceFields({ rooms, place = "gallery", item }: { rooms: { id: string; name: string }[]; place?: string; item?: string | null }) {
  const t = await getTranslations("Editor");
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("placeLabel")}</legend>
        <div className="flex flex-wrap gap-2">
          {photoPlaces.filter((p) => p !== "room" || rooms.length).map((p) => (
            <label key={p} className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 px-3 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white">
              <input type="radio" name="place" value={p} defaultChecked={p === place} className="sr-only" />
              {t(`place.${p}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {rooms.length ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("roomLabel")}
          <select name="item" defaultValue={item ?? ""} className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-base">
            <option value="">—</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      ) : null}
    </div>
  );
}
