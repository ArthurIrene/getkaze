import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { platform } from "@getkaze/core";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: platform.appName,
  // Demo data only: keep every page out of search engines until gate G2
  // (see CLAUDE.md "Never do" and specs/field-journal-template.md).
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // No client provider: guest pages have no client components of their own.
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
