import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionFacts } from "@getkaze/core";

/** What the access rules (packages/core canEnter) need to know about the visitor. RLS decides again on every query. */
export async function sessionFacts(supabase: SupabaseClient): Promise<SessionFacts & { userId: string | null; email: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { signedIn: false, aal: null, isPlatformAdmin: false, hasTotp: false, activeMemberships: 0, userId: null, email: null };
  }
  const [aal, factors, admin, memberships] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
    supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("memberships").select("id").eq("user_id", user.id).eq("status", "active"),
  ]);
  return {
    signedIn: true,
    aal: (aal.data?.currentLevel as "aal1" | "aal2" | null) ?? "aal1",
    isPlatformAdmin: Boolean(admin.data),
    hasTotp: (factors.data?.totp ?? []).some((f) => f.status === "verified"),
    activeMemberships: memberships.data?.length ?? 0,
    userId: user.id,
    email: user.email ?? null,
  };
}
