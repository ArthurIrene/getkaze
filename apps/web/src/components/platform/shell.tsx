import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { platform } from "@getkaze/core";
import { platformHref } from "@/lib/auth/paths";
import { routing } from "@/i18n/routing";

/** Plain platform frame (D-050): product name, language links to the same page, then the page. */
export async function Shell({ path, locale, children, aside }: { path: string; locale: string; children: ReactNode; aside?: ReactNode }) {
  const t = await getTranslations("Platform");
  return (
    <>
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
        <span className="text-lg font-bold tracking-tight">{platform.appName}</span>
        <div className="flex items-center gap-4">
          {aside}
          <nav aria-label={t("language")} className="flex gap-3 text-sm">
            {routing.locales.map((code) => (
              <a key={code} href={platformHref(path, code)} hrefLang={code} lang={code} aria-current={code === locale ? "page" : undefined} className={code === locale ? "font-semibold underline" : "text-neutral-600"}>
                {code.toUpperCase()}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">{children}</main>
    </>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">{children}</section>;
}

export function Field({ label, name, type = "text", autoComplete, required = true, maxLength, inputMode, pattern }: {
  label: string; name: string; type?: string; autoComplete?: string; required?: boolean; maxLength?: number; inputMode?: "numeric" | "email" | "text"; pattern?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required={required} maxLength={maxLength} inputMode={inputMode} pattern={pattern}
        className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-base font-normal focus:border-neutral-900 focus:outline-none" />
    </label>
  );
}

export function Submit({ children, tone = "primary", name, value }: { children: ReactNode; tone?: "primary" | "plain" | "danger"; name?: string; value?: string }) {
  const tones = {
    primary: "bg-neutral-900 text-white",
    plain: "border border-neutral-300 bg-white text-neutral-900",
    danger: "border border-red-300 bg-white text-red-700",
  };
  return (
    <button type="submit" name={name} value={value} className={`h-11 rounded-lg px-4 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const tones = { info: "bg-neutral-100 text-neutral-800", error: "bg-red-50 text-red-800", ok: "bg-green-50 text-green-800" };
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${tones[tone]}`}>{children}</p>;
}
