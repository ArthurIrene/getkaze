import { getTranslations, setRequestLocale } from "next-intl/server";
import { accentPalette, colorSets } from "@getkaze/core";
import { EditorFrame, SaveBar } from "@/components/editor/frame";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { saveLook } from "../actions";

const pill = "flex min-h-11 items-center gap-2 rounded-full border border-neutral-300 px-3 text-sm has-[:checked]:border-neutral-900 has-[:checked]:ring-2 has-[:checked]:ring-neutral-900";

/** Look & colors (D-040, O-Editor): template (Field Journal; others later), colour set, accent from the safe palette. */
export default async function LookPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/look">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const { data: s } = await supabase.from("site_settings").select("look").eq("business_id", id).maybeSingle();
  const look = (s?.look ?? {}) as { color_set?: string; accent?: string };
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/look`} back={editorHref(locale, id)} title={t("row.look")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>}>
      <form action={saveLook} className="flex flex-col gap-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("template")}</legend>
          <label className={pill}><input type="radio" name="template" value="field-journal" defaultChecked className="sr-only" />Field Journal</label>
          <p className="text-xs text-neutral-600">{t("templatesLater")}</p>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("colorSet")}</legend>
          <div className="flex flex-wrap gap-2">
            {colorSets.map((c) => (
              <label key={c} className={pill}><input type="radio" name="color_set" value={c} defaultChecked={(look.color_set ?? "auto") === c} className="sr-only" />{t(`colorSetName.${c}`)}</label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("accent")}</legend>
          <div className="flex flex-wrap gap-2">
            {accentPalette.map((a) => (
              <label key={a.id} className={pill}>
                <input type="radio" name="accent" value={a.id} defaultChecked={(look.accent ?? "forest") === a.id} className="sr-only" />
                <span aria-hidden="true" className="inline-block h-6 w-6 rounded-full border border-neutral-300" style={{ background: `linear-gradient(135deg, ${a.day} 50%, ${a.night} 50%)` }} />
                {t(`accentName.${a.id}`)}
              </label>
            ))}
          </div>
          <p className="text-xs text-neutral-600">{t("accentHint")}</p>
        </fieldset>
        <SaveBar label={t("save")} note={t("saveNote")} />
      </form>
    </EditorFrame>
  );
}
