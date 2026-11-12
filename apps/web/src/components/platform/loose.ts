/**
 * Look up wording by a key built at runtime (e.g. `errors.${code}`). The key
 * sets are fixed in messages/en.json; a missing key falls back to `fallback`.
 */
type Translator = { (key: never, values?: never): string; has: (key: never) => boolean };

export function loose(t: unknown) {
  const tr = t as Translator & ((key: string, values?: Record<string, string>) => string) & { has: (key: string) => boolean };
  const fn = (key: string, fallback?: string, values?: Record<string, string>) =>
    tr.has(key) ? tr(key, values) : (fallback ?? key);
  return fn;
}
