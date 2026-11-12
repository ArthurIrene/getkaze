import "server-only";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Supabase client for platform screens (login, owner, admin), signed in as
 * the visitor through HttpOnly cookies. Never used on guest pages.
 */
export async function platformClient() {
  const { url, anonKey } = supabaseEnv();
  const store = await cookies();
  const https = (await headers()).get("x-forwarded-proto") === "https";
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, { ...options, ...hardened(https) });
        } catch {
          // Server components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Session cookies are never readable by page scripts (no browser Supabase client exists). */
export function hardened(https: boolean) {
  return { httpOnly: true, sameSite: "lax" as const, secure: https, path: "/" };
}
