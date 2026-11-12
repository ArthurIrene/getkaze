import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { platform } from "@getkaze/core";
import { routing } from "@/i18n/routing";
import { getSite } from "@/data/get-site";
import { templateThemes } from "@/templates/registry";
import "../globals.css";

export const metadata: Metadata = {
  title: platform.appName,
  // Placeholder icons with the business's initials (pwa-manifest.md); the manifest link is added by app/manifest.ts.
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-180.png", sizes: "180x180" }],
  },
  // Demo data only: keep every page out of search engines until gate G2
  // (see CLAUDE.md "Never do" and specs/field-journal-template.md).
  robots: { index: false, follow: false },
};

/** Browser bar colour per scheme: the business template's paper colours (pwa-manifest.md). */
export async function generateViewport(): Promise<Viewport> {
  const theme = templateThemes[(await getSite()).template];
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: theme.paper },
      { media: "(prefers-color-scheme: dark)", color: theme.paperDark },
    ],
  };
}

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
