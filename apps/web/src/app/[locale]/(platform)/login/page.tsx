import type { Locale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, Field, Notice, Shell, Submit } from "@/components/platform/shell";
import { platformHref } from "@/lib/auth/paths";
import { signIn } from "../actions";

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const t = await getTranslations("Auth");
  return (
    <Shell path="/login" locale={locale}>
      <Card>
        <h1 className="mb-4 text-2xl font-bold">{t("signIn")}</h1>
        <form action={signIn} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          {q.error ? <Notice tone="error">{t("wrong")}</Notice> : null}
          <Field label={t("email")} name="email" type="email" autoComplete="email" maxLength={320} inputMode="email" />
          <Field label={t("password")} name="password" type="password" autoComplete="current-password" maxLength={72} />
          <Submit>{t("signIn")}</Submit>
          <a href={platformHref("/auth/reset", locale)} className="text-sm underline">{t("forgot")}</a>
        </form>
      </Card>
    </Shell>
  );
}
