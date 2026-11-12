import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { supabaseEnv } from "./env";

const hardened = (https: boolean) => ({ httpOnly: true, sameSite: "lax" as const, secure: https, path: "/" });

/** Keep a platform session fresh on platform paths only (called from the proxy). */
export async function refreshSession(request: NextRequest, response: NextResponse): Promise<void> {
  const { url, anonKey } = supabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        const https = request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:";
        for (const { name, value, options } of list) response.cookies.set(name, value, { ...options, ...hardened(https) });
      },
    },
  });
  await supabase.auth.getUser();
}
