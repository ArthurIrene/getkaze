/**
 * English fallback for platform wording (D-029, D-048): any key missing from
 * a translation uses the English text, so pages never show a blank or a raw
 * key. Empty strings count as missing.
 */
export type Messages = { [key: string]: string | Messages };

export function withFallback(english: Messages, translated: Messages): Messages {
  const result: Messages = {};
  for (const [key, base] of Object.entries(english)) {
    const value = translated[key];
    if (typeof base === "string") {
      result[key] = typeof value === "string" && value.trim() !== "" ? value : base;
    } else {
      result[key] = withFallback(
        base,
        value && typeof value === "object" ? value : {},
      );
    }
  }
  return result;
}
