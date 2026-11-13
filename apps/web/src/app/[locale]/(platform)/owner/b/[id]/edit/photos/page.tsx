import { getTranslations, setRequestLocale } from "next-intl/server";
import { photoLimits, pickText, publicMediaUrl, type LocalizedText } from "@getkaze/core";
import { EditorFrame } from "@/components/editor/frame";
import { LocalizedField } from "@/components/editor/localized";
import { PhotoUpload } from "@/components/editor/photo-upload";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { supabaseEnv } from "@/lib/supabase/env";
import { uploadPhoto } from "../actions";
import { PlaceFields } from "./place-fields";

/** Photos (O-Editor): the grid, and "Add photo" (shrunk on the phone before it is sent). */
export default async function PhotosPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/photos">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const [{ data: media }, { data: rooms }] = await Promise.all([
    supabase.from("media").select("id, place, alt, storage_path, format, width").eq("business_id", id).not("storage_path", "is", null).order("place").order("position").order("created_at"),
    supabase.from("catalog_items").select("id, name").eq("business_id", id).eq("kind", "room_type").order("position"),
  ]);
  const base = supabaseEnv().url;
  const full = (media ?? []).length >= photoLimits.photos;
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/photos`} back={editorHref(locale, id)} title={t("row.photos")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>} problems={["delete"]}>
      <p className="text-sm text-neutral-700">{t("photosHint")}</p>
      <p className="text-sm text-neutral-700">{t("photosTip")}</p>
      <ul className="grid grid-cols-3 gap-2" aria-label={t("row.photos")}>
        {(media ?? []).map((m) => (
          <li key={m.id}>
            <a href={editorHref(locale, id, `/photos/${m.id}`)} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element -- the 480 file, no optimizer */}
              <img src={publicMediaUrl(`${m.storage_path}/480.${m.format}`, base)} alt={pickText(m.alt as LocalizedText, locale as Locale)} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              <span className="text-xs text-neutral-700">{t(`place.${m.place as "hero"}`)}</span>
            </a>
          </li>
        ))}
      </ul>
      <section className="rounded-xl border border-neutral-200 bg-white p-4" aria-labelledby="add-photo">
        <h2 id="add-photo" className="mb-2 text-lg font-semibold">{t("addPhoto")}</h2>
        <p className="mb-1 text-sm text-neutral-700">{t("photoNote")}</p>
        <p className="mb-3 text-sm font-medium text-amber-900">{t("consent")}</p>
        {full ? <p role="status">{t("problem.count")}</p> : (
          <PhotoUpload
            action={uploadPhoto}
            hidden={{ locale, business: id }}
            doneHref={`${editorHref(locale, id, "/photos/__ID__")}?saved=1`}
            labels={{ pick: t("pickPhoto"), working: t("shrinking"), uploading: t("uploading"), tooBig: t("problem.tooBig"), notImage: t("problem.notImage"), failed: t("problem.upload"), save: t("addPhoto") }}
          >
            <PlaceFields rooms={(rooms ?? []).map((r) => ({ id: r.id, name: pickText(r.name as LocalizedText, locale as Locale) }))} />
            <LocalizedField label={t("alt")} name="alt" path="alt" languages={business.languages} checks={{}} required max={160} />
            <p className="-mt-2 text-xs text-neutral-600">{t("altHint")}</p>
          </PhotoUpload>
        )}
      </section>
    </EditorFrame>
  );
}
