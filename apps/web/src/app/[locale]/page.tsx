import { getTranslations, setRequestLocale } from "next-intl/server";
import { platform } from "@getkaze/core";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // The layout already rejects unknown locales with a 404.
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const languages = await getTranslations("Languages");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>

      <nav aria-label={t("languageLabel")} className="flex gap-2">
        {routing.locales.map((code) => (
          <Button
            key={code}
            asChild
            variant={code === locale ? "default" : "outline"}
            size="sm"
          >
            <Link
              href="/"
              locale={code}
              aria-current={code === locale ? "page" : undefined}
            >
              {languages(code)}
            </Link>
          </Button>
        ))}
      </nav>

      <p className="text-xs text-muted-foreground">
        {t("sharedCore", { name: platform.name })}
      </p>
    </main>
  );
}
