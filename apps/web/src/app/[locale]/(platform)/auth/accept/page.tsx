import type { Locale } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PasswordForm } from "@/components/platform/password-form";
import { Shell } from "@/components/platform/shell";
import { platformHref } from "@/lib/auth/paths";
import { platformClient } from "@/lib/supabase/server";

export default async function Page({ params, searchParams }: PageProps<"/[locale]/auth/accept">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const t = await getTranslations("Auth");
  // Only reachable with the session from an email link (/auth/confirm).
  const { data } = await (await platformClient()).auth.getUser();
  if (!data.user) redirect(platformHref("/login", locale));
  return (
    <Shell path="/auth/accept" locale={locale}>
      <PasswordForm locale={locale} back="/auth/accept" title={t("welcome")} problem={typeof q.problem === "string" ? q.problem : undefined} />
    </Shell>
  );
}
