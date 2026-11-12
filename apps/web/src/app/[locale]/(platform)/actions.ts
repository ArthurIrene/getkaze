"use server";

/**
 * Login, password reset and new-password actions (specs/auth.md, D-059).
 * Invite only: there is no sign-up action. Nothing here logs emails or
 * passwords (ESLint no-console covers this folder).
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { landingFor, passwordProblems, safeNext } from "@getkaze/core";
import { platformHref, requestOrigin } from "@/lib/auth/paths";
import { sessionFacts } from "@/lib/auth/session";
import { platformClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").slice(0, 320);

export async function signIn(form: FormData) {
  const locale = text(form, "locale");
  const supabase = await platformClient();
  const { error } = await supabase.auth.signInWithPassword({ email: text(form, "email").trim(), password: text(form, "password") });
  // One generic answer, whether or not the account exists.
  if (error) redirect(`${platformHref("/login", locale)}?error=1`);
  redirect(platformHref(landingFor(await sessionFacts(supabase)), locale));
}

export async function requestReset(form: FormData) {
  const locale = text(form, "locale");
  const email = text(form, "email").trim();
  if (email) {
    const supabase = await platformClient();
    // The email template links to /auth/confirm; redirectTo only sets the site origin for the link.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${requestOrigin(await headers())}/auth/confirm` });
  }
  // Always the same answer (no account probing).
  redirect(`${platformHref("/auth/reset", locale)}?sent=1`);
}

export async function setPassword(form: FormData) {
  const locale = text(form, "locale");
  const back = safeNext(text(form, "back"), "/auth/update-password");
  const password = text(form, "password");
  const problems = passwordProblems(password, text(form, "repeat"));
  if (problems.length) redirect(`${platformHref(back, locale)}?problem=${problems[0]}`);
  const supabase = await platformClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`${platformHref(back, locale)}?problem=${error.code === "same_password" ? "same" : "failed"}`);
  // Accepting an invite: the person's own invited memberships become active.
  if (back === "/auth/accept") await supabase.rpc("accept_my_invites");
  const facts = await sessionFacts(supabase);
  redirect(`${platformHref(landingFor(facts), locale)}?saved=1`);
}

export async function signOut(form: FormData) {
  const locale = text(form, "locale");
  const supabase = await platformClient();
  await supabase.auth.signOut();
  redirect(platformHref("/login", locale));
}
