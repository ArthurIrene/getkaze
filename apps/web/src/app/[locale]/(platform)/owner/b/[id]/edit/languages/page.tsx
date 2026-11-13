import { getTranslations, setRequestLocale } from "next-intl/server";
import { infoTexts, languageProgress, type LocalizedText } from "@getkaze/core";
import { EditorFrame, SaveBar } from "@/components/editor/frame";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { saveLanguages } from "../actions";

/** Languages (O-Editor): English always on; Kinyarwanda and French switches with how many texts are filled. */
export default async function LanguagesPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/languages">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const [{ data: s }, { data: items }, { data: media }] = await Promise.all([
    supabase.from("site_settings").select("location, hours").eq("business_id", id).maybeSingle(),
    supabase.from("catalog_items").select("id, name, line").eq("business_id", id),
    supabase.from("media").select("id, alt").eq("business_id", id),
  ]);
  const location = (s?.location ?? {}) as { area?: LocalizedText; directions?: LocalizedText[] };
  const texts: Record<string, LocalizedText | undefined> = {
    ...infoTexts({ location: { map_url: "", area: location.area, directions: location.directions ?? [] }, hours: (s?.hours ?? []) as LocalizedText[] }),
    ...Object.fromEntries((items ?? []).flatMap((i) => [[`item.${i.id}.name`, i.name], [`item.${i.id}.line`, i.line ?? undefined]])),
    ...Object.fromEntries((media ?? []).map((m) => [`media.${m.id}.alt`, m.alt])),
  };
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/languages`} back={editorHref(locale, id)} title={t("row.languages")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>}>
      <form action={saveLanguages} className="flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4">
          <span className="font-medium">English · {t("required")}</span>
          <input type="checkbox" checked disabled className="h-5 w-5" aria-label="English" />
        </label>
        {(["rw", "fr"] as const).map((l) => {
          const p = languageProgress(texts, l);
          return (
            <label key={l} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2" data-lang={l}>
              <span className="flex flex-col">
                <span className="font-medium">{t(`lang.${l}`)}</span>
                <span className="text-xs text-neutral-600">{t("filled", { done: p.done, total: p.total })}</span>
              </span>
              <input type="checkbox" name={`lang.${l}`} defaultChecked={business.languages.includes(l)} className="h-5 w-5" />
            </label>
          );
        })}
        <p className="text-sm text-neutral-600">{t("languagesHint")}</p>
        <SaveBar label={t("save")} note={t("saveNote")} />
      </form>
    </EditorFrame>
  );
}
