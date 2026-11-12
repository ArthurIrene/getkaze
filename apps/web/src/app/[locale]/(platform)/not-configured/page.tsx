import type { Locale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, Shell } from "@/components/platform/shell";

/**
 * Shown for every platform path while the Supabase settings are missing
 * (the proxy rewrites here with status 503). Not reachable by its own address:
 * /not-configured is a guest path and gives the clean 404.
 */
export const dynamic = "force-dynamic";

export default async function NotConfiguredPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Platform");
  return (
    <Shell path="/login" locale={locale}>
      <Card>
        <h1 className="mb-2 text-2xl font-bold">{t("notConfiguredTitle")}</h1>
        <p className="text-neutral-700">{t("notConfigured")}</p>
      </Card>
    </Shell>
  );
}
