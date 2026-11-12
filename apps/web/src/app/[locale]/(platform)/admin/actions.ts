"use server";

/**
 * Platform admin actions (specs/platform-admin.md). Each one re-checks the
 * admin + aal2 rule on the server; RLS checks it again in the database (D-060).
 * Nothing here logs emails or other personal data.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  canSetStatus,
  looksLikeEmail,
  normalizeSlug,
  presetDefaults,
  presetOfStyle,
  slugProblems,
  supportReasonProblems,
  type BusinessStatus,
  type Preset,
} from "@getkaze/core";
import { platformHref, requestOrigin } from "@/lib/auth/paths";
import { requireArea } from "@/lib/auth/require";
import { platformClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/admin";

const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

async function admin(form: FormData) {
  const locale = text(form, "locale", 5);
  const { supabase, facts } = await requireArea("admin", locale);
  return { supabase, facts, locale };
}

const detail = (locale: string, id: string, q = "") => `${platformHref(`/admin/b/${id}`, locale)}${q}`;

// ---------- 2FA (TOTP) ----------
export async function verifyTotp(form: FormData) {
  const locale = text(form, "locale", 5);
  const factorId = text(form, "factorId", 64);
  const code = text(form, "code", 6).replace(/\D/g, "");
  const supabase = await platformClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  const back = text(form, "back", 40) === "enroll" ? "/admin/mfa/enroll" : "/admin/mfa";
  if (error) redirect(`${platformHref(back, locale)}?error=code`);
  redirect(platformHref("/admin", locale));
}

// ---------- Businesses ----------
export async function createBusiness(form: FormData) {
  const { supabase, locale } = await admin(form);
  const name = text(form, "name", 80);
  const slug = (text(form, "slug", 60) || normalizeSlug(name)).toLowerCase();
  const style = text(form, "style", 20);
  const preset = presetOfStyle(style) as Preset;
  const currency = text(form, "currency", 3) === "usd" ? "usd" : "rwf";
  const languages = ["en", ...(form.get("rw") ? ["rw"] : [])];
  const back = (q: string) => redirect(`${platformHref("/admin/new", locale)}?${q}`);

  if (!name) back("error=name");
  const problems = slugProblems(slug);
  if (problems.length) back(`error=slug_${problems[0]}&slug=${encodeURIComponent(slug)}`);
  if (!preset) back("error=style");

  const { data, error } = await supabase
    .from("businesses")
    .insert({ name, slug, legal_name: name, preset, style, default_currency: currency, languages })
    .select("id")
    .single();
  if (error || !data) back(error?.code === "23505" ? `error=slug_taken&slug=${encodeURIComponent(slug)}` : "error=failed");

  const defaults = presetDefaults(preset);
  await supabase.from("site_settings").insert({
    business_id: data!.id,
    sections: defaults.sections.map((id) => ({ id, visible: true })),
  });
  const { data: modules } = await supabase.from("modules").select("id, presets");
  await supabase.from("business_modules").insert(
    (modules ?? [])
      .filter((m: { presets: string[] }) => m.presets.includes(preset))
      .map((m: { id: string }) => ({ business_id: data!.id, module_id: m.id, enabled: (defaults.modulesOn as string[]).includes(m.id) })),
  );
  redirect(detail(locale, data!.id, "?created=1"));
}

export async function updateBasics(form: FormData) {
  const { supabase, locale } = await admin(form);
  const id = text(form, "id", 64);
  const slug = text(form, "slug", 60).toLowerCase();
  const status = text(form, "status", 10) as BusinessStatus;
  const customDomain = text(form, "customDomain", 253).toLowerCase() || null;
  const problems = slugProblems(slug);
  if (problems.length) redirect(detail(locale, id, `?error=slug_${problems[0]}`));
  const { data: site } = await supabase.from("site_settings").select("published_at").eq("business_id", id).maybeSingle();
  if (!canSetStatus(status, { publishedAt: site?.published_at ?? null })) redirect(detail(locale, id, "?error=not_published"));
  const { error } = await supabase
    .from("businesses")
    .update({ name: text(form, "name", 80), legal_name: text(form, "legalName", 120), slug, status, custom_domain: customDomain })
    .eq("id", id);
  if (error) redirect(detail(locale, id, `?error=${error.code === "23505" ? "slug_taken" : "failed"}`));
  redirect(detail(locale, id, "?saved=1"));
}

export async function toggleModule(form: FormData) {
  const { supabase, locale } = await admin(form);
  const id = text(form, "id", 64);
  const moduleId = text(form, "module", 40);
  const enabled = text(form, "enabled", 5) === "true";
  const { error } = await supabase.from("business_modules").upsert({ business_id: id, module_id: moduleId, enabled });
  redirect(detail(locale, id, error ? "?error=failed" : "?saved=1"));
}

// ---------- Owners ----------
export async function inviteOwner(form: FormData) {
  const { supabase, facts, locale } = await admin(form);
  const id = text(form, "id", 64);
  const email = text(form, "email", 320).toLowerCase();
  if (!looksLikeEmail(email)) redirect(detail(locale, id, "?error=email"));
  // The only use of the service role: sending the invite (D-059). The admin + aal2 check ran above.
  const origin = requestOrigin(await headers());
  const { data, error } = await serviceClient().auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/auth/confirm` });
  if (error || !data.user) redirect(detail(locale, id, "?error=invite"));
  const { error: memberError } = await supabase
    .from("memberships")
    .insert({ business_id: id, user_id: data.user.id, roles: ["owner"], status: "invited", invited_by: facts.userId });
  redirect(detail(locale, id, memberError ? "?error=member" : "?invited=1"));
}

export async function setMemberStatus(form: FormData) {
  const { supabase, locale } = await admin(form);
  const id = text(form, "id", 64);
  const status = text(form, "status", 10) === "active" ? "active" : "disabled";
  await supabase.from("memberships").update({ status }).eq("id", text(form, "membership", 64)).eq("business_id", id);
  redirect(detail(locale, id, "?saved=1"));
}

// ---------- Support access (logged and visible to the owner) ----------
export async function openSupport(form: FormData) {
  const { supabase, facts, locale } = await admin(form);
  const id = text(form, "id", 64);
  const reason = text(form, "reason", 200);
  if (supportReasonProblems(reason).length) redirect(detail(locale, id, "?error=reason"));
  const { error } = await supabase.from("support_access").insert({ business_id: id, admin_id: facts.userId, reason });
  redirect(detail(locale, id, error ? "?error=failed" : "?support=open"));
}

export async function closeSupport(form: FormData) {
  const { supabase, locale } = await admin(form);
  const id = text(form, "id", 64);
  await supabase.from("support_access").update({ ended_at: new Date().toISOString() }).eq("id", text(form, "session", 64)).is("ended_at", null);
  redirect(detail(locale, id, "?support=closed"));
}
