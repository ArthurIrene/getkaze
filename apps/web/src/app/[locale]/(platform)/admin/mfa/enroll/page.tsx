import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, Field, Notice, Shell, Submit } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { platformHref } from "@/lib/auth/paths";
import { sessionFacts } from "@/lib/auth/session";
import { platformClient } from "@/lib/supabase/server";
import { verifyTotp } from "../../actions";

/** First-time 2FA for a platform admin: scan the QR (or type the key), then enter a 6-digit code (D-060). */
export default async function EnrollPage({ params, searchParams }: PageProps<"/[locale]/admin/mfa/enroll">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const t = await getTranslations("Admin");
  const supabase = await platformClient();
  const facts = await sessionFacts(supabase);
  if (!facts.signedIn) redirect(platformHref("/login", locale));
  if (!facts.isPlatformAdmin) redirect(platformHref("/owner", locale));
  if (facts.hasTotp) redirect(platformHref("/admin/mfa", locale));

  // Start clean: drop earlier unfinished enrolments, then start one.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Kaze admin" });
  return (
    <Shell path="/admin/mfa/enroll" locale={locale}>
      <Card>
        <h1 className="mb-2 text-2xl font-bold">{t("enrollTitle")}</h1>
        <p className="mb-4 text-sm text-neutral-700">{t("enrollHelp")}</p>
        {error || !data ? (
          <Notice tone="error">{t("failed")}</Notice>
        ) : (
          <form action={verifyTotp} className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code SVG data URL from Supabase */}
            <img src={data.totp.qr_code} alt={t("qrAlt")} width={200} height={200} className="self-center" />
            <p className="text-sm">{t("orKey")} <code data-testid="totp-secret" className="break-all rounded bg-neutral-100 px-1 font-mono">{data.totp.secret}</code></p>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="factorId" value={data.id} />
            <input type="hidden" name="back" value="enroll" />
            {q.error ? <Notice tone="error">{t("wrongCode")}</Notice> : null}
            <Field label={t("code")} name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" />
            <Submit>{t("verify")}</Submit>
          </form>
        )}
      </Card>
    </Shell>
  );
}
