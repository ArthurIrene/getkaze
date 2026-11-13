import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Notice, Shell } from "@/components/platform/shell";
import { platformHref } from "@/lib/auth/paths";

/**
 * Editor page frame (D-050, plain platform style): back link, title, the
 * business name, the support banner when we are editing, and the saved or
 * error notice from the last save.
 */
export async function EditorFrame({ locale, path, back, title, business, support, q, problems = [], children }: {
  locale: string; path: string; back: string; title: string; business: string; support: boolean;
  q: { saved?: string; deleted?: string; error?: string }; problems?: string[]; children: ReactNode;
}) {
  const t = await getTranslations("Editor");
  const known = new Set(problems);
  const errors = (q.error ?? "").split(",").filter(Boolean);
  return (
    <Shell path={path} locale={locale}>
      <div className="flex flex-col gap-4">
        <a href={back} className="text-sm text-neutral-700 underline">← {t("back")}</a>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-neutral-600">{business}</p>
        </div>
        {support ? <Notice tone="info">{t("supportEditing")}</Notice> : null}
        {q.saved ? <Notice tone="ok">{t("saved")}</Notice> : null}
        {q.deleted ? <Notice tone="ok">{t("deleted")}</Notice> : null}
        {errors.length ? (
          <Notice tone="error">
            {errors.map((e) => (known.has(e) ? t(`problem.${e}` as "problem.save") : t("problem.save"))).join(" ")}
          </Notice>
        ) : null}
        {children}
      </div>
    </Shell>
  );
}

export const ownerHref = (locale: string) => platformHref("/owner", locale);

export function SaveBar({ label, note }: { label: string; note: string }) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-col gap-1 border-t border-neutral-200 bg-white/95 px-4 py-3">
      <button type="submit" className="h-12 rounded-lg bg-neutral-900 text-base font-semibold text-white">{label}</button>
      <p className="text-center text-xs text-neutral-600">{note}</p>
    </div>
  );
}
