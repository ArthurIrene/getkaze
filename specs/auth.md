# Feature: Owner and admin login (email and password, invite only)
Module: Platform core (access)   Priority: P1   Preset: both
Decisions: **D-059** (email and password through Supabase Auth, invite only, no public sign-up, no SMS, custom sender before G2), D-060 (admin TOTP), D-022 (instant disable), D-034, D-029 (platform screens EN + RW), ROLES.md §3.
Conflicts: overview points 1 (new packages), 5 (service role key), 7 (cookies on platform paths only), 10 (built-in email sender), 11 (Kinyarwanda drafts).

Goal: Owners and admins sign in safely with nothing to pay per login, and nobody we did not invite can get an account.

Users: owners (invited by the platform admin) and platform admins. Guests never log in.

## Screens (platform style: plain, the GetKaze/"Kaze" name from `platform`, phone first; EN at `/…`, RW at `/rw/…`)
- **`/login`:** email, password, "Sign in", "Forgot password?". On success: platform admins go to `/admin` (which asks for TOTP, platform-admin.md), owners go to `/owner`. One generic error ("Email or password is wrong"), whether the account exists or not.
- **`/auth/reset`:** an email field, then "If that email has an account, we sent a link." The same answer always (no account probing).
- **`/auth/callback`** (route): exchanges the email link code for a session (PKCE), then redirects to `next` (allow-listed: `/auth/update-password`, `/owner`, `/admin`).
- **`/auth/update-password`:** a new password typed twice (min 10 characters, not all digits; core rule), then "Saved, you are signed in."
- **`/auth/accept`:** where invite links land. Set a first password (the same rules), then `/owner`.
- **Sign out:** a POST form button on the owner and admin pages, then `/login`.
- No sign-up page exists, and Supabase sign-up is off (`enable_signup = false`). Invites come only from platform-admin.md.

## How (Supabase Auth with `@supabase/ssr`, server-side)
- A server client is built per request in server actions and route handlers, with cookies `HttpOnly`, `Secure` and `SameSite=Lax`.
- **Middleware:** next-intl as today, plus a Supabase session refresh **only** on `/login`, `/auth/*`, `/owner*` and `/admin*` (and their `/rw` versions). **Guest pages never run the auth code and never get a cookie** (the Batch 1 test stays).
- **Access rules in `packages/core`** (`access.ts`, unit tested):
  - `landingFor(user)`: admin or owner.
  - `canEnter(area, session)`: `owner` needs an active membership; `admin` needs a `platform_admins` row **and** aal2.
  - `passwordProblems(pw)`.
  - `safeNext(next)`: allow list, so there are no open redirects.
  - The database (RLS) enforces the same rules again.
- **Disabled membership:** the owner can still sign in but sees "No active site" (D-022 instant disable). Data stays closed by RLS.
- **Email:** Supabase's built-in sender, for testing only (D-059). In CI and locally, Mailpit catches the emails, and Playwright reads the link from the Mailpit API.
- **Rate limits:** Supabase's defaults (sign-in, reset) stay on. Our server actions add nothing that logs passwords or emails.
- **No logging** of emails or passwords in our code (ESLint `no-console` extends to `src/app/(platform)/**`).

## Data
Supabase `auth.users` (owner and admin accounts; allowed after registration, D-033) and `memberships` / `platform_admins` (core-data.md). No new tables.

## Permissions
Public: `/login` and `/auth/*`. Signed in: `/owner`. Signed in with aal2: `/admin`.

## Module switch
None (platform).

## Languages (new Kinyarwanda drafts, D-048; added to the glossary)
| Key | English | Kinyarwanda draft |
|---|---|---|
| Auth.signIn | Sign in | Injira |
| Auth.signOut | Sign out | Sohoka |
| Auth.email | Email | Imeli |
| Auth.password | Password | Ijambo ry'ibanga |
| Auth.forgot | Forgot password? | Wibagiwe ijambo ry'ibanga? |
| Auth.wrong | Email or password is wrong. | Imeli cyangwa ijambo ry'ibanga si byo. |
| Auth.resetSent | If that email has an account, we sent a link. | Niba iyo meli ifite konti, twohereje umurongo. |
| Auth.newPassword | New password | Ijambo ry'ibanga rishya |
| Auth.repeat | Type it again | Ryandike nanone |
| Auth.rules | At least 10 characters, not only numbers. | Nibura inyuguti 10, si imibare gusa. |
| Auth.saved | Saved. You are signed in. | Byabitswe. Winjiye. |
| Auth.noSite | No active site for this account. | Nta rubuga rukora kuri iyi konti. |

## Acceptance criteria
1. Given an invited owner, when they open the invite email link (from Mailpit), set a password and continue, then they land on `/owner` signed in.
2. Given a wrong password or an unknown email, when they sign in, then they see the same generic error.
3. Given "Forgot password?", when an email is submitted, then the same message shows. For a real account, the reset link lets them set a new password and sign in.
4. Given anyone, when they try to sign up (Supabase API `signUp`), then it is refused (sign-up is off).
5. Given a guest page (`/`, `/rooms`, …), when it loads, then no `Set-Cookie` is sent (Batch 1 test) and no Supabase JS is in the first view (weight check).
6. Given `next=https://evil.example`, when the callback runs, then it redirects to `/owner`, not to the outside URL.

Playwright (against local Supabase in CI): the invite → accept → owner flow, wrong password, the reset flow through Mailpit, sign out, and the cookie check. Unit tests: the access rules, `safeNext` and the password rules.

## Out of scope
Staff phone + PIN logins (D-022, P2/P3), social logins, SMS, a custom email sender (before G2), "remember this device".

## Definition of Done
BUILD_GUIDE.md §2.
