import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { amenityIcons, type LocalizedText, type RoomInput, type TranslationChecks } from "@getkaze/core";
import { EditorFrame, SaveBar } from "@/components/editor/frame";
import { LocalizedField, TextInput } from "@/components/editor/localized";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { deleteRoom, saveRoom } from "../../actions";

const problems = ["name", "priceRwf", "priceUsd", "maxGuests", "units", "amenity", "save", "missing"];

/** Room form (O-Editor): names and line in each language, both prices (D-023), guests, units, amenities, shown or hidden. */
export default async function RoomPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/rooms/[roomId]">) {
  const { locale, id, roomId } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  if (business.preset !== "hotel_lodge") notFound();
  const t = await getTranslations("Editor");
  const isNew = roomId === "new";
  const { data: room } = isNew
    ? { data: null }
    : await supabase.from("catalog_items").select("id, name, line, price_rwf, price_usd, max_guests, units, amenities, visible, translations_checked").eq("id", roomId).eq("business_id", id).eq("kind", "room_type").maybeSingle();
  if (!isNew && !room) notFound();
  const checks = (room?.translations_checked ?? {}) as TranslationChecks;
  const amenities = [...((room?.amenities ?? []) as RoomInput["amenities"]), undefined, undefined].slice(0, 6);
  const langs = business.languages;
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/rooms/${roomId}`} back={editorHref(locale, id, "/rooms")} title={isNew ? t("addRoom") : t("editRoom")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>} problems={problems}>
      <form action={saveRoom} className="flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <input type="hidden" name="room" value={roomId} />
        <LocalizedField label={t("roomName")} name="name" path="name" value={room?.name as LocalizedText | undefined} languages={langs} checks={checks} required max={80} />
        <LocalizedField label={t("roomLine")} name="line" path="line" value={(room?.line as LocalizedText | null) ?? undefined} languages={langs} checks={checks} max={160} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("prices")}</legend>
          <p className="text-xs text-neutral-600">{t("pricesHint")}</p>
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="RWF" name="price_rwf" value={room?.price_rwf as number | undefined} inputMode="numeric" required max={12} />
            <TextInput label="USD" name="price_usd" value={room?.price_usd as number | undefined} inputMode="decimal" required max={10} />
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <TextInput label={t("maxGuests")} name="max_guests" value={(room?.max_guests as number | undefined) ?? 2} inputMode="numeric" required max={2} />
          <TextInput label={t("units")} name="units" value={(room?.units as number | undefined) ?? 1} inputMode="numeric" required max={3} />
        </div>
        <p className="-mt-3 text-xs text-neutral-600">{t("unitsHint")}</p>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">{t("amenities")}</legend>
          {amenities.map((a, n) => (
            <div key={n} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
              <label className="flex flex-col gap-1 text-xs text-neutral-600">
                {t("amenityIcon")}
                <select name={`amenity.${n}.icon`} defaultValue={a?.icon ?? ""} className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-base">
                  <option value="">—</option>
                  {amenityIcons.map((icon) => <option key={icon} value={icon}>{t(`icon.${icon}`)}</option>)}
                </select>
              </label>
              <LocalizedField label={`${t("amenityLabel")} ${n + 1}`} name={`amenity.${n}.label`} path={`amenity.${n}`} value={a?.label} languages={langs} checks={checks} max={40} />
            </div>
          ))}
        </fieldset>
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4">
          <span className="font-medium">{t("showOnSite")}</span>
          <input type="checkbox" name="visible" defaultChecked={room ? Boolean(room.visible) : true} className="h-5 w-5" />
        </label>
        {!isNew ? <a href={editorHref(locale, id, "/photos")} className="text-sm underline">{t("roomPhotos")}</a> : null}
        <SaveBar label={t("save")} note={t("saveNote")} />
      </form>
      {!isNew ? (
        <form action={deleteRoom}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="business" value={id} />
          <input type="hidden" name="room" value={roomId} />
          <details className="rounded-xl border border-red-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-red-700">{t("deleteRoom")}</summary>
            <p className="my-2 text-sm">{t("deleteRoomConfirm")}</p>
            <button type="submit" className="h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700">{t("deleteYes")}</button>
          </details>
        </form>
      ) : null}
    </EditorFrame>
  );
}
