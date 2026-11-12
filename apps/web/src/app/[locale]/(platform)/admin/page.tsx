import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminBar } from "@/components/platform/admin-bar";
import { Card, Shell } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { platformHref } from "@/lib/auth/paths";
import { requireArea } from "@/lib/auth/require";
import { loose } from "@/components/platform/loose";

type Row = {
  id: string; name: string; slug: string; status: string; preset: string; style: string;
  business_modules: { module_id: string; enabled: boolean }[];
  memberships: { status: string }[];
};

/** Clients: every business, with status, preset, modules on and owner status (A-Admin). */
export default async function AdminHome({ params, searchParams }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase } = await requireArea("admin", locale);
  const t = await getTranslations("Admin");
  const tx = loose(t);
  const status = typeof q.status === "string" ? q.status : "";
  const search = typeof q.q === "string" ? q.q.slice(0, 60) : "";
  let query = supabase.from("businesses").select("id, name, slug, status, preset, style, business_modules(module_id, enabled), memberships(status)").order("name");
  if (["draft", "active", "paused"].includes(status)) query = query.eq("status", status);
  if (search) query = query.ilike("name", `%${search.replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const rows = (data ?? []) as Row[];
  return (
    <Shell path="/admin" locale={locale} aside={<AdminBar locale={locale} />}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{t("clients")}</h1>
        <form className="flex flex-wrap gap-2 text-sm" method="get">
          <input name="q" defaultValue={search} placeholder={t("search")} aria-label={t("search")} className="h-10 rounded-lg border border-neutral-300 px-3" />
          <select name="status" defaultValue={status} aria-label={t("status")} className="h-10 rounded-lg border border-neutral-300 px-2">
            <option value="">{t("all")}</option>
            {(["draft", "active", "paused"] as const).map((s) => <option key={s} value={s}>{tx(`statusName.${s}`)}</option>)}
          </select>
          <button className="h-10 rounded-lg border border-neutral-300 px-3">{t("filter")}</button>
        </form>
        {rows.length === 0 ? <Card><p>{t("noClients")}</p></Card> : null}
        <ul className="flex flex-col gap-2">
          {rows.map((b) => {
            const modulesOn = b.business_modules.filter((m) => m.enabled).map((m) => m.module_id);
            const owner = b.memberships.some((m) => m.status === "active") ? "active" : b.memberships.some((m) => m.status === "invited") ? "invited" : "none";
            return (
              <li key={b.id}>
                <a href={platformHref(`/admin/b/${b.id}`, locale)} className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <b>{b.name}</b>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs" data-status={b.status}>{tx(`statusName.${b.status}`)}</span>
                  </div>
                  <p className="text-sm text-neutral-600">{b.slug} · {tx(`styleName.${b.style}`)} · {t("modulesOn")}: {modulesOn.join(", ") || "—"} · {t("owner")}: {tx(`ownerStatus.${owner}`)}</p>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}
