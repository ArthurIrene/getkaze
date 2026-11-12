import { getTranslations } from "next-intl/server";
import { Card, Field, Notice, Submit } from "./shell";
import { setPassword } from "@/app/[locale]/(platform)/actions";

/** New password, typed twice (invite acceptance and password reset). */
export async function PasswordForm({ locale, back, title, problem }: { locale: string; back: "/auth/accept" | "/auth/update-password"; title: string; problem?: string }) {
  const t = await getTranslations("Auth");
  const problems: Record<string, string> = {
    too_short: t("rules"), too_long: t("rules"), only_digits: t("rules"), mismatch: t("mismatch"), same: t("same"), failed: t("failed"),
  };
  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <form action={setPassword} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="back" value={back} />
        {problem ? <Notice tone="error">{problems[problem] ?? t("failed")}</Notice> : <Notice>{t("rules")}</Notice>}
        <Field label={t("newPassword")} name="password" type="password" autoComplete="new-password" maxLength={72} />
        <Field label={t("repeat")} name="repeat" type="password" autoComplete="new-password" maxLength={72} />
        <Submit>{t("save")}</Submit>
      </form>
    </Card>
  );
}
