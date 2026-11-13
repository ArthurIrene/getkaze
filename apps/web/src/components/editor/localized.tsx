import { getTranslations } from "next-intl/server";
import { translationState, type ContentLocale, type LocalizedText, type TranslationChecks } from "@getkaze/core";

const input = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base font-normal focus:border-neutral-900 focus:outline-none";

/**
 * One translatable field (D-029, D-048): English required, then each language
 * the site has on, each with its marker: "Missing", or "Draft" with a "tap
 * when checked" tick, or "Checked". Stacked at 360 px, side by side on wide
 * screens. Inputs are named "<name>.<lang>"; ticks "check.<path>.<lang>".
 */
export async function LocalizedField({ label, name, path, value, languages, checks, required = false, max = 300 }: {
  label: string; name: string; path: string; value?: LocalizedText; languages: readonly ContentLocale[];
  checks: TranslationChecks; required?: boolean; max?: number;
}) {
  const t = await getTranslations("Editor");
  const others = languages.filter((l): l is "rw" | "fr" => l !== "en");
  return (
    <fieldset className="flex flex-col gap-2" data-field={path}>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className={`grid gap-2 ${others.length ? "md:grid-cols-2" : ""}`}>
        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          EN{required ? ` · ${t("required")}` : ""}
          <input className={input} name={`${name}.en`} defaultValue={value?.en ?? ""} required={required} maxLength={max} lang="en" />
        </label>
        {others.map((l) => {
          const state = translationState(value, l, checks, path);
          return (
            <label key={l} className="flex flex-col gap-1 text-xs text-neutral-600">
              <span className="flex flex-wrap items-center gap-2">
                {l.toUpperCase()}
                {state === "missing" ? <span data-marker="missing" className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">{t("missing", { lang: l.toUpperCase() })}</span> : null}
                {state === "draft" ? <span data-marker="draft" className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-800">{t("draft")}</span> : null}
                {state === "checked" ? <span data-marker="checked" className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">{t("checked")}</span> : null}
              </span>
              <input className={input} name={`${name}.${l}`} defaultValue={value?.[l] ?? ""} maxLength={max} lang={l} />
              {state === "draft" ? (
                <span className="flex items-center gap-2 text-sm text-neutral-800">
                  <input type="checkbox" name={`check.${path}.${l}`} className="h-5 w-5" aria-label={`${label} ${l.toUpperCase()}: ${t("tapChecked")}`} />
                  {t("tapChecked")}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TextInput({ label, name, value, type = "text", required = false, max = 120, inputMode, autoComplete }: {
  label: string; name: string; value?: string | number | null; type?: string; required?: boolean; max?: number;
  inputMode?: "tel" | "email" | "decimal" | "numeric" | "text"; autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input className={input} name={name} type={type} defaultValue={value ?? ""} required={required} maxLength={max} inputMode={inputMode} autoComplete={autoComplete} />
    </label>
  );
}
