import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { platform } from "@getkaze/core";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: platform.appName,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Locale only: no messages are sent to the browser, keeping pages light.
            Pass the few keys a client component needs when one appears. */}
        <NextIntlClientProvider messages={null}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
