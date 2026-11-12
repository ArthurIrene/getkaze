import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, Field, Notice, Shell, Submit } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { platformHref } from "@/lib/auth/paths";
import { sessionFacts } from "@/lib/auth/session";
import { platformClient } from "@/lib/supabase/server";
import { verifyTotp } from "../actions";

/** Every admin session: enter the 6-digit code to reach aal2 (D-060). */
export default async function MfaPage({ params, searchParams }: PageProps<"/[locale]/admin/mfa">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const t = await getTranslations("Admin");
  const supabase = await platformClient();
  const facts = await sessionFacts(supabase);
  if (!facts.signedIn) redirect(platformHref("/login", locale));
  if (!facts.isPlatformAdmin) redirect(platformHref("/owner", locale));
  if (!facts.hasTotp) redirect(platformHref("/admin/mfa/enroll", locale));
  if (facts.aal === "aal2") redirect(platformHref("/admin", locale));
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp.find((f) => f.status === "verified");
  return (
    <Shell path="/admin/mfa" locale={locale}>
      <Card>
        <h1 className="mb-4 text-2xl font-bold">{t("codeTitle")}</h1>
        <form action={verifyTotp} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="factorId" value={factor?.id ?? ""} />
          {q.error ? <Notice tone="error">{t("wrongCode")}</Notice> : null}
          <Field label={t("code")} name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" />
          <Submit>{t("verify")}</Submit>
        </form>
      </Card>
    </Shell>
  );
}
