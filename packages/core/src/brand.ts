/** Placeholder brand helpers (pwa-manifest.md) until owners upload a logo. */

/** Up to two initials from a business name: "Kinigi Hills" → "KH", "Ikaze" → "I". */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/[\s'-]+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => Array.from(w)[0]!.toLocaleUpperCase())
    .join("");
}

/** Home-screen name: the full name if it fits (≤ 12 characters), else its first word. */
export function shortName(name: string): string {
  const clean = name.trim();
  if (Array.from(clean).length <= 12) return clean;
  const first = clean.split(/\s+/)[0] ?? clean;
  return Array.from(first).slice(0, 12).join("");
}
