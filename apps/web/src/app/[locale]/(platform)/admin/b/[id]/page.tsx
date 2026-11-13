import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pickText, siteBaseUrl, type LocalizedText } from "@getkaze/core";
import { AdminBar } from "@/components/platform/admin-bar";
import { Card, Field, Notice, Shell, Submit } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { platformHref } from "@/lib/auth/paths";
import { requireArea } from "@/lib/auth/require";
import { loose } from "@/components/platform/loose";
import { hostConfig } from "@/lib/hosts";
import { closeSupport, inviteOwner, openSupport, setMemberStatus, toggleModule, updateBasics } from "../../actions";

/** Client detail (A-Admin): basics, module switches, owner invite and members, support sessions, recent changes. */
export default async function BusinessDetail({ params, searchParams }: PageProps<"/[locale]/admin/b/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, facts } = await requireArea("admin", locale);
  const t = await getTranslations("Admin");
  const tx = loose(t);

  const [{ data: b }, { data: modules }, { data: switches }, { data: members }, { data: support }, { data: changes }, { data: site }] = await Promise.all([
    supabase.from("businesses").select("id, name, legal_name, slug, custom_domain, status, preset, style").eq("id", id).maybeSingle(),
    supabase.from("modules").select("id, name, presets").order("id"),
    supabase.from("business_modules").select("module_id, enabled").eq("business_id", id),
    supabase.from("memberships").select("id, user_id, roles, status, created_at").eq("business_id", id).order("created_at"),
    supabase.from("support_access").select("id, admin_id, reason, started_at, ended_at").eq("business_id", id).order("started_at", { ascending: false }).limit(10),
    supabase.from("content_changes").select("id, actor_kind, table_name, action, at").eq("business_id", id).order("at", { ascending: false }).limit(20),
    supabase.from("site_settings").select("published_at").eq("business_id", id).maybeSingle(),
  ]);
  if (!b) notFound();

  const on = new Map((switches ?? []).map((s) => [s.module_id, s.enabled]));
  const openSession = (support ?? []).find((s) => !s.ended_at && s.admin_id === facts.userId);
  const error = typeof q.error === "string" ? q.error : "";
  const hidden = (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={b.id} />
    </>
  );
  return (
    <Shell path={`/admin/b/${b.id}`} locale={locale} aside={<AdminBar locale={locale} />}>
      <div className="flex flex-col gap-4">
        {openSession ? <Notice tone="info">{t("supportBanner", { reason: openSession.reason })}</Notice> : null}
        {openSession ? <a href={platformHref(`/owner/b/${id}/edit`, locale)} className="text-sm font-semibold underline">{t("openEditor")}</a> : null}
        {error ? <Notice tone="error">{tx(`errors.${error}`, t("failed"))}</Notice> : null}
        {q.saved || q.created ? <Notice tone="ok">{t(q.created ? "created" : "saved")}</Notice> : null}
        {q.invited ? <Notice tone="ok">{t("invited")}</Notice> : null}
        <h1 className="text-2xl font-bold">{b.name}</h1>
        <p className="text-sm text-neutral-600">
          {tx(`presetName.${b.preset}`)} · {tx(`styleName.${b.style}`)} · <a className="underline" href={siteBaseUrl(b, hostConfig())}>{siteBaseUrl(b, hostConfig())}</a>
          {site?.published_at ? "" : ` · ${t("notPublished")}`}
        </p>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("basics")}</h2>
          <form action={updateBasics} className="flex flex-col gap-3">
            {hidden}
            <label className="flex flex-col gap-1 text-sm font-medium">{t("name")}<input name="name" defaultValue={b.name} maxLength={80} required className="h-11 rounded-lg border border-neutral-300 px-3 text-base font-normal" /></label>
            <label className="flex flex-col gap-1 text-sm font-medium">{t("legalName")}<input name="legalName" defaultValue={b.legal_name} maxLength={120} className="h-11 rounded-lg border border-neutral-300 px-3 text-base font-normal" /></label>
            <label className="flex flex-col gap-1 text-sm font-medium">{t("slug")}<input name="slug" defaultValue={b.slug} maxLength={40} required className="h-11 rounded-lg border border-neutral-300 px-3 font-mono text-base font-normal" /></label>
            <label className="flex flex-col gap-1 text-sm font-medium">{t("customDomain")}<input name="customDomain" defaultValue={b.custom_domain ?? ""} maxLength={253} placeholder="example.rw" className="h-11 rounded-lg border border-neutral-300 px-3 font-mono text-base font-normal" /></label>
            <label className="flex flex-col gap-1 text-sm font-medium">{t("status")}
              <select name="status" defaultValue={b.status} className="h-11 rounded-lg border border-neutral-300 px-2 text-base font-normal">
                {(["draft", "active", "paused"] as const).map((s) => <option key={s} value={s}>{tx(`statusName.${s}`)}</option>)}
              </select>
            </label>
            <Submit>{t("save")}</Submit>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("modules")}</h2>
          <ul className="flex flex-col gap-2">
            {(modules ?? []).filter((m) => m.presets.includes(b.preset)).map((m) => {
              const enabled = on.get(m.id) ?? false;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span>{pickText(m.name as LocalizedText, locale as Locale)} <span className="text-xs text-neutral-500">({m.id})</span></span>
                  <form action={toggleModule}>
                    {hidden}
                    <input type="hidden" name="module" value={m.id} />
                    <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                    <button type="submit" aria-pressed={enabled} aria-label={`${pickText(m.name as LocalizedText, locale as Locale)}: ${enabled ? t("on") : t("off")}`}
                      className={`h-9 min-w-16 rounded-full px-3 text-sm font-semibold ${enabled ? "bg-neutral-900 text-white" : "border border-neutral-300 bg-white"}`}>
                      {enabled ? t("on") : t("off")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("owner")}</h2>
          <form action={inviteOwner} className="mb-4 flex flex-col gap-3">
            {hidden}
            <Field label={t("inviteEmail")} name="email" type="email" maxLength={320} inputMode="email" />
            <Submit>{t("inviteOwner")}</Submit>
          </form>
          <ul className="flex flex-col gap-2 text-sm">
            {(members ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2" data-member-status={m.status}>
                <span>{m.roles.join(", ")} · {tx(`memberStatus.${m.status}`)}</span>
                <form action={setMemberStatus}>
                  {hidden}
                  <input type="hidden" name="membership" value={m.id} />
                  <input type="hidden" name="status" value={m.status === "disabled" ? "active" : "disabled"} />
                  <Submit tone={m.status === "disabled" ? "plain" : "danger"}>{m.status === "disabled" ? t("enable") : t("disable")}</Submit>
                </form>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("support")}</h2>
          {openSession ? (
            <form action={closeSupport}>
              {hidden}
              <input type="hidden" name="session" value={openSession.id} />
              <Submit tone="plain">{t("closeSupport")}</Submit>
            </form>
          ) : (
            <form action={openSupport} className="flex flex-col gap-3">
              {hidden}
              <Field label={t("reason")} name="reason" maxLength={200} />
              <Submit>{t("openSupport")}</Submit>
            </form>
          )}
          <ul className="mt-3 flex flex-col gap-1 text-sm text-neutral-700">
            {(support ?? []).map((s) => (
              <li key={s.id}>{new Date(s.started_at).toISOString().slice(0, 16).replace("T", " ")} · {s.reason} · {s.ended_at ? t("closed") : t("open")}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{t("recentChanges")}</h2>
          <ul className="flex flex-col gap-1 text-sm text-neutral-700">
            {(changes ?? []).map((c) => (
              <li key={c.id}>{new Date(c.at).toISOString().slice(0, 16).replace("T", " ")} · {c.actor_kind} · {c.action} {c.table_name}</li>
            ))}
          </ul>
        </Card>

        <a href={platformHref("/admin", locale)} className="text-sm underline">← {t("clients")}</a>
      </div>
    </Shell>
  );
}
