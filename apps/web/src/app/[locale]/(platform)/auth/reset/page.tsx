import type { Locale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, Field, Notice, Shell, Submit } from "@/components/platform/shell";
import { requestReset } from "../../actions";

export default async function ResetPage({ params, searchParams }: PageProps<"/[locale]/auth/reset">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const t = await getTranslations("Auth");
  return (
    <Shell path="/auth/reset" locale={locale}>
      <Card>
        <h1 className="mb-4 text-2xl font-bold">{t("forgot")}</h1>
        {q.sent ? (
          <Notice tone="ok">{t("resetSent")}</Notice>
        ) : (
          <form action={requestReset} className="flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            <Field label={t("email")} name="email" type="email" autoComplete="email" maxLength={320} inputMode="email" />
            <Submit>{t("sendLink")}</Submit>
          </form>
        )}
      </Card>
    </Shell>
  );
}
