import type { ReactNode } from "react";
import type { Viewport } from "next";
import "../../platform.css";
import { fieldJournalTheme } from "@/templates/field-journal/theme";

/** Platform screens keep the Field Journal browser bar colour (unchanged behaviour). */
export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: fieldJournalTheme.paper },
      { media: "(prefers-color-scheme: dark)", color: fieldJournalTheme.paperDark },
    ],
  };
}

/** Platform screens (login, owner, admin) share this wrapper; each page renders <Shell>. Not a guest page. */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <div className="pf min-h-screen bg-neutral-50 text-neutral-900">{children}</div>;
}
