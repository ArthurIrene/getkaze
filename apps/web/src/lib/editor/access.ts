import "server-only";
import { notFound, redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { canEditSite, siteCacheTags, type ContentLocale } from "@getkaze/core";
import { platformHref } from "@/lib/auth/paths";
import { sessionFacts } from "@/lib/auth/session";
import { platformClient } from "@/lib/supabase/server";

export type EditorBusiness = {
  id: string; name: string; slug: string; custom_domain: string | null; preset: string; status: string;
  languages: ContentLocale[]; default_currency: "rwf" | "usd";
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * The editor of one business (specs/batch-3a-editor.md "Who"): an active
 * owner, or a platform admin at aal2 with an open support session. Decided by
 * core canEditSite; RLS decides again on every read and write. Anyone else
 * gets a plain 404 (no hint that the business exists).
 */
export async function requireEditor(businessId: string, locale: string) {
  if (!uuid.test(businessId)) notFound();
  const supabase = await platformClient();
  const facts = await sessionFacts(supabase);
  if (!facts.signedIn || !facts.userId) redirect(platformHref("/login", locale));
  const [{ data: member }, { data: support }, { data: business }] = await Promise.all([
    supabase.from("memberships").select("roles, status").eq("business_id", businessId).eq("user_id", facts.userId).maybeSingle(),
    facts.isPlatformAdmin
      ? supabase.from("support_access").select("id").eq("business_id", businessId).eq("admin_id", facts.userId).is("ended_at", null).limit(1)
      : Promise.resolve({ data: [] }),
    supabase.from("businesses").select("id, name, slug, custom_domain, preset, status, languages, default_currency").eq("id", businessId).maybeSingle(),
  ]);
  const access = canEditSite(member as { roles: string[]; status: string } | null, {
    isPlatformAdmin: facts.isPlatformAdmin,
    aal: facts.aal,
    openSupport: (support ?? []).length > 0,
  });
  if (!access.ok || !business) notFound();
  return { supabase, facts, access, business: business as EditorBusiness };
}

/** After a save: the guest site shows the change on its next request (cache tags of data/get-site.ts). */
export function refreshSite(business: Pick<EditorBusiness, "slug" | "custom_domain">) {
  for (const tag of siteCacheTags(business)) updateTag(tag);
}

export const editorHref = (locale: string, businessId: string, rest = "") => platformHref(`/owner/b/${businessId}/edit${rest}`, locale);
