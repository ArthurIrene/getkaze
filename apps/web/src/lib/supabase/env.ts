/**
 * Supabase settings, read when called (never inlined at build time).
 * - both set: configured; every database error is a real error.
 * - both missing: not configured; guest pages use the bundled demo, platform
 *   screens say "not configured yet" (specs/demo-lodge-database.md, until G2).
 * - only one set: a broken setup, so supabaseEnv() throws.
 */
const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const read = (name: string) => process.env[name] || undefined;

export function supabaseConfigured(): boolean {
  return Boolean(read(URL_KEY) || read(ANON_KEY));
}

export function supabaseEnv(): { url: string; anonKey: string } {
  const url = read(URL_KEY);
  const anonKey = read(ANON_KEY);
  const missing = [!url && URL_KEY, !anonKey && ANON_KEY].filter(Boolean);
  if (missing.length) throw new Error(`Missing ${missing.join(" and ")}. See .env.example and specs/db-testing-and-migrations.md.`);
  return { url: url!, anonKey: anonKey! };
}
