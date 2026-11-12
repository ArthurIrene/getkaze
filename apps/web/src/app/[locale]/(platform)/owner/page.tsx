import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ownerSiteSummary, pickText, platform, whatsAppLink, type BusinessStatus, type LocalizedText } from "@getkaze/core";
import { Card, Notice, Shell, Submit } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { platformHref } from "@/lib/auth/paths";
import { requireArea } from "@/lib/auth/require";
import { hostConfig } from "@/lib/hosts";

/**
 * "Your site" (specs/owner-your-site.md): each business the owner belongs to,
 * whether it is live, its address, the modules on, and our support visits
 * (ROLES.md §5). Read only, through RLS as the signed-in owner. The full
 * dashboard comes in Batch 3.
 */
export default async function OwnerPage({ params, searchParams }: PageProps<"/[locale]/owner">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, facts, entry } = await requireArea("owner", locale);
  if (facts.isPlatformAdmin && facts.activeMemberships === 0) redirect(platformHref("/admin", locale));
  const t = await getTranslations("Owner");
  const a = await getTranslations("Auth");

  const [{ data: businesses }, { data: modules }, { data: visits }] = entry.ok
    ? await Promise.all([
        supabase.from("businesses").select("id, name, slug, status, languages, business_modules(module_id, enabled)"),
        supabase.from("modules").select("id, name"),
        supabase.from("support_access").select("id, business_id, reason, started_at, ended_at").order("started_at", { ascending: false }).limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const names = new Map((modules ?? []).map((m) => [m.id as string, pickText(m.name as LocalizedText, locale as Locale)]));
  const cards = ownerSiteSummary(
    (businesses ?? []).map((b) => ({
      id: b.id, name: b.name, slug: b.slug, status: b.status as BusinessStatus, languages: b.languages,
      modulesOn: (b.business_modules as { module_id: string; enabled: boolean }[]).filter((m) => m.enabled).map((m) => m.module_id),
    })),
    hostConfig(),
  );
  const help = (
    <a className="text-sm underline" href={whatsAppLink(platform.supportWhatsApp, t("helpMessage"))}>{t("help")}</a>
  );
  const when = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");
  return (
    <Shell path="/owner" locale={locale} aside={
      <form action={platformHref("/auth/signout", locale)} method="post"><Submit tone="plain">{a("signOut")}</Submit></form>
    }>
      <div className="flex flex-col gap-4">
        {q.saved ? <Notice tone="ok">{a("saved")}</Notice> : null}
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {cards.length === 0 ? (
          <Card><p className="mb-2">{a("noSite")}</p>{help}</Card>
        ) : (
          cards.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-col gap-3" data-business={c.id}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">{c.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.statusKey === "live" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-700"}`}>{t(c.statusKey)}</span>
                </div>
                <p className="break-all text-sm"><a className="underline" href={c.address}>{t("open")}</a> <span className="text-neutral-600">{c.address}</span></p>
                <p className="text-sm text-neutral-700">{t("languages")}: {c.languages.join(", ")}</p>
                <div className="text-sm">
                  <b>{t("modules")}</b>
                  {c.modulesOn.length ? (
                    <ul className="list-disc pl-5">{c.modulesOn.map((m) => <li key={m}>{names.get(m) ?? m}</li>)}</ul>
                  ) : <p className="text-neutral-600">—</p>}
                </div>
                <div className="text-sm">
                  <b>{t("support")}</b>
                  {(visits ?? []).filter((v) => v.business_id === c.id).length ? (
                    <ul className="flex flex-col gap-1">
                      {(visits ?? []).filter((v) => v.business_id === c.id).map((v) => (
                        <li key={v.id} data-visit>{when(v.started_at)}{v.ended_at ? ` – ${when(v.ended_at)}` : ` · ${t("ongoing")}`} · {v.reason}</li>
                      ))}
                    </ul>
                  ) : <p className="text-neutral-600">{t("noSupport")}</p>}
                </div>
              </div>
            </Card>
          ))
        )}
        {cards.length ? help : null}
      </div>
    </Shell>
  );
}
