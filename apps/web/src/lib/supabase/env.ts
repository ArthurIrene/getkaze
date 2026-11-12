/** Supabase settings from the environment (names only in .env.example). Server code only. */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(Boolean);
  if (missing.length) {
    throw new Error(`Missing ${missing.join(" and ")}. See .env.example and specs/db-testing-and-migrations.md.`);
  }
  return { url: url!, anonKey: anonKey! };
}
