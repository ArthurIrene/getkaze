import type { Locale } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { canEnter } from "@getkaze/core";
import { Card, Notice, Shell, Submit } from "@/components/platform/shell";
import { platformHref } from "@/lib/auth/paths";
import { sessionFacts } from "@/lib/auth/session";
import { platformClient } from "@/lib/supabase/server";

/** Owner area. Feature 6 (specs/owner-your-site.md) fills in "Your site". */
export default async function OwnerPage({ params, searchParams }: PageProps<"/[locale]/owner">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const t = await getTranslations("Auth");
  const o = await getTranslations("Owner");
  const supabase = await platformClient();
  const facts = await sessionFacts(supabase);
  const entry = canEnter("owner", facts);
  if (!entry.ok && entry.to === "login") redirect(platformHref("/login", locale));
  return (
    <Shell path="/owner" locale={locale} aside={
      <form action={platformHref("/auth/signout", locale)} method="post"><Submit tone="plain">{t("signOut")}</Submit></form>
    }>
      <div className="flex flex-col gap-4">
        {q.saved ? <Notice tone="ok">{t("saved")}</Notice> : null}
        <h1 className="text-2xl font-bold">{o("title")}</h1>
        {entry.ok ? null : <Card><p>{t("noSite")}</p></Card>}
      </div>
    </Shell>
  );
}
