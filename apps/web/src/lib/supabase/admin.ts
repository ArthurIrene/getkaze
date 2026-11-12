import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Service-role client. Used ONLY by the owner-invite action in platform admin,
 * after the caller passed the admin + aal2 check (specs/platform-admin.md).
 * ESLint forbids importing this file anywhere else; the client-bundle guard
 * fails if the key or this code reaches the browser.
 */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server only, Vercel Production only).");
  return createClient(supabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
