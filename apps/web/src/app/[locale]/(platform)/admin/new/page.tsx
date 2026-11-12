import { getTranslations, setRequestLocale } from "next-intl/server";
import { presets } from "@getkaze/core";
import { AdminBar } from "@/components/platform/admin-bar";
import { Card, Field, Notice, Shell, Submit } from "@/components/platform/shell";
import type { Locale } from "@/i18n/routing";
import { requireArea } from "@/lib/auth/require";
import { loose } from "@/components/platform/loose";
import { createBusiness } from "../actions";

/** New business: name, slug (from the name if empty), preset and style, currency, languages. Starts as a draft. */
export default async function NewBusiness({ params, searchParams }: PageProps<"/[locale]/admin/new">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  await requireArea("admin", locale);
  const t = await getTranslations("Admin");
  const tx = loose(t);
  const error = typeof q.error === "string" ? q.error : "";
  return (
    <Shell path="/admin/new" locale={locale} aside={<AdminBar locale={locale} />}>
      <Card>
        <h1 className="mb-4 text-2xl font-bold">{t("newBusiness")}</h1>
        <form action={createBusiness} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          {error ? <Notice tone="error">{tx(`errors.${error}`, t("failed"))}</Notice> : null}
          <Field label={t("name")} name="name" maxLength={80} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("slug")}
            <input name="slug" defaultValue={typeof q.slug === "string" ? q.slug : ""} maxLength={40} placeholder={t("slugHint")} className="h-11 rounded-lg border border-neutral-300 px-3 font-mono text-base font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("presetAndStyle")}
            <select name="style" required className="h-11 rounded-lg border border-neutral-300 px-2 text-base font-normal">
              {(Object.keys(presets) as (keyof typeof presets)[]).map((p) => (
                <optgroup key={p} label={tx(`presetName.${p}`)}>
                  {presets[p].map((s) => <option key={s} value={s}>{tx(`styleName.${s}`)}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("currency")}
            <select name="currency" className="h-11 rounded-lg border border-neutral-300 px-2 text-base font-normal">
              <option value="rwf">RWF</option>
              <option value="usd">USD</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="rw" defaultChecked /> {t("kinyarwandaOn")}</label>
          <Submit>{t("create")}</Submit>
        </form>
      </Card>
    </Shell>
  );
}
