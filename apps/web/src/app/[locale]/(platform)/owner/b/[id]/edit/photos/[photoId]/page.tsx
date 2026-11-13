import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pickText, publicMediaUrl, type LocalizedText, type TranslationChecks } from "@getkaze/core";
import { EditorFrame, SaveBar } from "@/components/editor/frame";
import { LocalizedField } from "@/components/editor/localized";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { supabaseEnv } from "@/lib/supabase/env";
import { removePhoto, savePhoto } from "../../actions";
import { PlaceFields } from "../place-fields";

/** One photo: where it shows, alt text per language, delete (its files go too). */
export default async function PhotoPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/photos/[photoId]">) {
  const { locale, id, photoId } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const [{ data: m }, { data: rooms }] = await Promise.all([
    supabase.from("media").select("id, place, item_id, alt, storage_path, format, translations_checked").eq("id", photoId).eq("business_id", id).maybeSingle(),
    supabase.from("catalog_items").select("id, name").eq("business_id", id).eq("kind", "room_type").order("position"),
  ]);
  if (!m || !m.storage_path) notFound();
  const alt = m.alt as LocalizedText;
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/photos/${photoId}`} back={editorHref(locale, id, "/photos")} title={t("photo")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>} problems={["place", "alt", "room", "save", "missing"]}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the 480 file, no optimizer */}
      <img src={publicMediaUrl(`${m.storage_path}/480.${m.format}`, supabaseEnv().url)} alt={pickText(alt, locale as Locale)} className="w-full rounded-xl object-cover" />
      <form action={savePhoto} className="flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <input type="hidden" name="media" value={m.id} />
        <PlaceFields rooms={(rooms ?? []).map((r) => ({ id: r.id, name: pickText(r.name as LocalizedText, locale as Locale) }))} place={m.place} item={m.item_id} />
        <LocalizedField label={t("alt")} name="alt" path="alt" value={alt} languages={business.languages} checks={(m.translations_checked ?? {}) as TranslationChecks} required max={160} />
        <SaveBar label={t("save")} note={t("saveNote")} />
      </form>
      <form action={removePhoto}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <input type="hidden" name="media" value={m.id} />
        <details className="rounded-xl border border-red-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-red-700">{t("deletePhoto")}</summary>
          <p className="my-2 text-sm">{t("deleteConfirm")}</p>
          <button type="submit" className="h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700">{t("deleteYes")}</button>
        </details>
      </form>
    </EditorFrame>
  );
}
