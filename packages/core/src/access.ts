/**
 * Who may go where (specs/auth.md, D-059, D-060). The database enforces the
 * same rules again with row-level security; these keep screens honest.
 */

export type Area = "owner" | "admin";

export type SessionFacts = {
  signedIn: boolean;
  /** Assurance level from the session: aal2 after a TOTP code (D-060). */
  aal: "aal1" | "aal2" | null;
  isPlatformAdmin: boolean;
  /** Has at least one verified TOTP factor. */
  hasTotp: boolean;
  activeMemberships: number;
};

export type Entry =
  | { ok: true }
  | { ok: false; to: "login" | "mfa-enroll" | "mfa-verify" | "no-site" | "owner" };

/** Whether a session may enter an area, and where to send it if not. */
export function canEnter(area: Area, s: SessionFacts): Entry {
  if (!s.signedIn) return { ok: false, to: "login" };
  if (area === "admin") {
    if (!s.isPlatformAdmin) return { ok: false, to: "owner" };
    if (!s.hasTotp) return { ok: false, to: "mfa-enroll" };
    if (s.aal !== "aal2") return { ok: false, to: "mfa-verify" };
    return { ok: true };
  }
  if (s.activeMemberships === 0) return { ok: false, to: "no-site" };
  return { ok: true };
}

/** Where a fresh sign-in goes: admins to the admin (which asks for the code), everyone else to their site. */
export function landingFor(s: Pick<SessionFacts, "isPlatformAdmin">): "/admin" | "/owner" {
  return s.isPlatformAdmin ? "/admin" : "/owner";
}

const SAFE_NEXT = ["/owner", "/admin", "/auth/update-password", "/auth/accept"] as const;
export type SafeNext = (typeof SAFE_NEXT)[number];

/** Only our own pages may follow a sign-in or an email link (no open redirect). */
export function safeNext(next: string | null | undefined, fallback: SafeNext = "/owner"): SafeNext {
  if (!next) return fallback;
  return (SAFE_NEXT as readonly string[]).includes(next) ? (next as SafeNext) : fallback;
}

export const passwordLimits = { min: 10, max: 72 } as const;

export type PasswordProblem = "too_short" | "too_long" | "only_digits" | "mismatch";

/** Problems with a new password (and its repeat). Supabase enforces its own minimum too. */
export function passwordProblems(password: string, repeat?: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  const length = Array.from(password).length;
  if (length < passwordLimits.min) problems.push("too_short");
  if (length > passwordLimits.max) problems.push("too_long");
  if (/^\d+$/.test(password)) problems.push("only_digits");
  if (repeat !== undefined && repeat !== password) problems.push("mismatch");
  return problems;
}

/** Email link types we accept on /auth/confirm, and where each one goes. */
export function confirmTarget(type: string | null): SafeNext | null {
  if (type === "invite") return "/auth/accept";
  if (type === "recovery") return "/auth/update-password";
  return null;
}

/**
 * Platform paths (login, email links, owner, admin), with or without a
 * language prefix such as /rw. Only these may run auth code or set cookies;
 * guest pages never do (Batch 1 "no cookies" rule).
 */
export function isPlatformPath(pathname: string): boolean {
  const path = pathname.replace(/^\/(rw|fr)(?=\/|$)/, "") || "/";
  return /^\/(login|auth|owner|admin)(\/|$)/.test(path);
}
