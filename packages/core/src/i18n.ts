/** Languages for owner content (D-029). English is required. */
export const contentLocales = ["en", "rw", "fr"] as const;
export type ContentLocale = (typeof contentLocales)[number];

/** A text the owner writes, per language. English is required. */
export type LocalizedText = { en: string } & Partial<Record<Exclude<ContentLocale, "en">, string>>;

/**
 * Text in the chosen language, falling back to English when that language
 * is missing or empty (D-029, D-048).
 */
export function pickText(text: LocalizedText, locale: ContentLocale): string {
  const value = text[locale];
  return typeof value === "string" && value.trim() !== "" ? value : text.en;
}
