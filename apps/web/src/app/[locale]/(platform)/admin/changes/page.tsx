import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ChangeLogRow } from "@getkaze/core";
import { ChangeList } from "@/components/editor/change-list";
import { Shell } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { platformHref } from "@/lib/auth/paths";
import { requireArea } from "@/lib/auth/require";

const PAGE = 50;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Changes (admin, aal2): every business's log with the actor's email; each read is recorded for the owners (approved point 10). */
export default async function AdminChangesPage({ params, searchParams }: PageProps<"/[locale]/admin/changes">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase } = await requireArea("admin", locale);
  const t = await getTranslations("Changes");
  const business = typeof q.business === "string" && uuid.test(q.business) ? q.business : null;
  const page = Math.max(0, Math.min(1000, Number(q.page) || 0));
  const [{ data }, { data: businesses }] = await Promise.all([
    supabase.rpc("get_change_log", { p_business: business, p_offset: page * PAGE, p_limit: PAGE + 1 }),
    supabase.from("businesses").select("id, name").order("name"),
  ]);
  const rows = (data ?? []) as ChangeLogRow[];
  const next = new URLSearchParams({ ...(business ? { business } : {}), page: String(page + 1) });
  return (
    <Shell path="/admin/changes" locale={locale}>
      <div className="flex flex-col gap-4">
        <a href={platformHref("/admin", locale)} className="text-sm text-neutral-700 underline">← {t("back")}</a>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-neutral-700">{t("adminHint")}</p>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("business")}
            <select name="business" defaultValue={business ?? ""} className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-base">
              <option value="">{t("allBusinesses")}</option>
              {(businesses ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <button type="submit" className="h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold">{t("filter")}</button>
        </form>
        <ChangeList rows={rows.slice(0, PAGE)} admin />
        {rows.length > PAGE ? <a className="text-sm font-semibold underline" href={`${platformHref("/admin/changes", locale)}?${next}`}>{t("older")}</a> : null}
      </div>
    </Shell>
  );
}
