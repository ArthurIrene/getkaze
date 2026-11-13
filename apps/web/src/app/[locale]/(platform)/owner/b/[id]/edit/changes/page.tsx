import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ChangeLogRow } from "@getkaze/core";
import { ChangeList } from "@/components/editor/change-list";
import { EditorFrame } from "@/components/editor/frame";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";

const PAGE = 50;

/** Changes (owner): who changed what and when on this site, with our support visits and log reads (ROLES.md §5). */
export default async function ChangesPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/changes">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const page = Math.max(0, Math.min(1000, Number(q.page) || 0));
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Changes");
  const { data } = await supabase.rpc("get_change_log", { p_business: id, p_offset: page * PAGE, p_limit: PAGE + 1 });
  const rows = (data ?? []) as ChangeLogRow[];
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/changes`} back={editorHref(locale, id)} title={t("title")} business={business.name} support={access.ok && access.as === "support"} q={{}}>
      <p className="text-sm text-neutral-700">{t("hint")}</p>
      <ChangeList rows={rows.slice(0, PAGE)} />
      {rows.length > PAGE ? <a className="text-sm font-semibold underline" href={`${editorHref(locale, id, "/changes")}?page=${page + 1}`}>{t("older")}</a> : null}
    </EditorFrame>
  );
}
