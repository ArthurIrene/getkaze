import { getTranslations, setRequestLocale } from "next-intl/server";
import { fullSections, requiredModule, type SectionSetting } from "@getkaze/core";
import { EditorFrame, SaveBar } from "@/components/editor/frame";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { saveSections } from "../actions";

/** Sections (D-042, O-Editor): home sections in order, each on or off; one that needs an off module can't be switched on. */
export default async function SectionsPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/sections">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const [{ data: s }, { data: modules }] = await Promise.all([
    supabase.from("site_settings").select("sections").eq("business_id", id).maybeSingle(),
    supabase.from("business_modules").select("module_id").eq("business_id", id).eq("enabled", true),
  ]);
  const on = new Set((modules ?? []).map((m) => m.module_id as string));
  const sections = fullSections((s?.sections ?? []) as SectionSetting[]);
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/sections`} back={editorHref(locale, id)} title={t("row.sections")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>} problems={["order", "save"]}>
      <p className="text-sm text-neutral-700">{t("sectionsHint")}</p>
      <form action={saveSections} className="flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {sections.map((sec, n) => {
            const needs = requiredModule[sec.id];
            const locked = Boolean(needs && !on.has(needs));
            return (
              <li key={sec.id} className="flex items-center gap-2 px-3 py-2" data-section={sec.id}>
                <input type="hidden" name="order" value={sec.id} />
                <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3">
                  <input type="checkbox" name={`show.${sec.id}`} defaultChecked={sec.visible && !locked} disabled={locked} className="h-5 w-5" />
                  <span className="flex flex-col">
                    <span className="font-medium">{t(`section.${sec.id}`)}</span>
                    {locked ? <span className="text-xs text-amber-800">{t("needsModule", { module: t(`module.${needs!}` as "module.menu") })}</span> : null}
                  </span>
                </label>
                <button type="submit" name="move" value={`${sec.id}:up`} disabled={n === 0} aria-label={`${t("moveUp")}: ${t(`section.${sec.id}`)}`} className="h-11 w-11 rounded-lg border border-neutral-300 disabled:opacity-30">↑</button>
                <button type="submit" name="move" value={`${sec.id}:down`} disabled={n === sections.length - 1} aria-label={`${t("moveDown")}: ${t(`section.${sec.id}`)}`} className="h-11 w-11 rounded-lg border border-neutral-300 disabled:opacity-30">↓</button>
              </li>
            );
          })}
        </ul>
        <SaveBar label={t("save")} note={t("saveNote")} />
      </form>
    </EditorFrame>
  );
}
