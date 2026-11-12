# Feature: Platform admin (with TOTP 2FA)
Module: Platform admin (ours)   Priority: P1   Preset: both
Decisions: **D-060** (TOTP, aal2 for admin screens and data), D-017 (module switches; locked modules as upgrades), D-016/D-043 (presets and styles), D-034 (logged support access, visible to the owner), D-059 (invite only), D-021 (new modules off), ROLES.md (Platform admin), A-Admin mockup (Clients, New business, Client detail).
Conflicts: overview point 9 (the first admin is added by you with SQL on staging). Billing, the overdue list, discounts and the data protection gate from A-Admin are **not** in this batch (P1/P2 later).

Goal: We can create a business, set its preset and modules, give it a subdomain and invite its owner, safely, from a phone, with every support visit logged.

Users: platform admins only.

## Screens (`/admin…`, platform style, phone first, EN and RW; layouts follow A-Admin where it exists)
- **2FA gate** (every `/admin` request):
  - Signed in but with no TOTP factor yet: **`/admin/mfa/enroll`** shows the QR (the SVG that Supabase returns), the secret as text, and a 6-digit code field to verify.
  - Factor present but session aal1: **`/admin/mfa`** asks for the 6-digit code.
  - Only aal2 sees admin pages. RLS also refuses admin data without aal2 (row-level-security.md).
- **`/admin` (Clients):** a list of businesses with name, slug, status pill (draft, active, paused), preset and style, modules on, and owner status (invited or active). A filter by status and a search by name.
- **`/admin/new` (New business):** name, slug (prefilled from the name via core `normalizeSlug`, editable, checked for format, reserved words and uniqueness), preset (Hotel/Lodge, Restaurant & Bar), style (lodge, town hotel, guesthouse, or restaurant-first, bar-first), template (Field Journal), default currency and languages.
  - Create: inserts `businesses` (status `draft`), an empty `site_settings` with the preset's default sections, and `business_modules` with the preset defaults (core `presetDefaults`). New non-default modules are off.
- **`/admin/b/<id>` (Client detail):**
  - **Basics:** name, slug (the subdomain field) and custom domain (stored only; wiring at G2), status (draft, active, paused; "active" needs a published site), and the site link (from core `siteBaseUrl`).
  - **Modules:** one switch per module with on or off (save per switch; logged).
  - **Owner:** an "Invite owner" email field. It sends a Supabase invite (service role, server only) and creates `memberships` (owner, `invited`). The list of members has a disable button (instant disable, D-022).
  - **Support access:** "Open support session" with a required reason. It writes a `support_access` row (start, and end when closed). The owner sees it on `/owner` (owner-your-site.md). While a session is open, a banner shows on admin pages for that business.
  - **Recent changes:** the last 20 `content_changes` rows.
- **Server actions** carry out every change. Each one re-checks aal2 on the server, and RLS checks it again. There are no client components except where a form needs them; the admin may use JavaScript (not a guest page).

## Data
Reads and writes `businesses`, `site_settings` (created empty), `business_modules`, `memberships`, `support_access`, and reads `content_changes`. Change log triggers record every change with `actor_kind = 'platform_admin'`.

## Rules in `packages/core` (unit tested)
`normalizeSlug`, `slugProblems` (format, reserved, length), `presetDefaults`, `canActivate(business)` (needs a published `site_settings`), `siteBaseUrl(business, config)` (shared with business-by-host.md) and `supportReasonProblems`.

## First admin (once per environment; by you, not by me)
- **Staging:** sign in once at `/login` after an invite from the Supabase dashboard (Authentication → Users → Invite). Then, in the SQL editor: `insert into public.platform_admins (user_id) select id from auth.users where email = '<your email>';`. Then `/admin/mfa/enroll`.
- **Local and CI:** the test seed creates an admin user with a known test password and a TOTP secret (fake). Playwright generates TOTP codes in the test (RFC 6238 with Node `crypto`; no new package).

## Permissions
Platform admin with aal2 only (screens **and** data).

## Module switch
This is where the switches live. An off module is invisible on the guest site; the locked upgrade cards are Batch 3 (owner dashboard).

## Languages (Kinyarwanda drafts; also in the glossary)
Admin wording is EN and RW: Clients "Abakiriya", New business "Ubucuruzi bushya", Modules "Ibice", Invite owner "Tumira nyir'ubucuruzi", Support session "Igihe cy'ubufasha", Reason "Impamvu", Status: draft "Igitekerezo", active "Gikora", paused "Cyahagaritswe", Enter the 6-digit code "Andika imibare 6".

## Acceptance criteria
1. Given an admin with aal1, when they open `/admin`, then they are sent to the TOTP step, and a direct database read of other businesses returns nothing.
2. Given an admin who enrols TOTP and enters a valid code, when they open `/admin`, then the client list shows.
3. Given New business with name "Volcano View" and preset Hotel/Lodge, when created, then the slug is `volcano-view`, the status is draft, the preset modules are on and the others off, and a change-log row exists.
4. Given a taken or reserved slug (`admin`), when saving, then an error names the problem and nothing is saved.
5. Given a module switch flipped, when saved, then `business_modules` changes and the change log records the admin.
6. Given "Invite owner", when sent, then Mailpit receives the invite and a membership exists with status `invited` (auth.md continues the flow).
7. Given "Open support session" with a reason, when opened and closed, then a `support_access` row with start and end exists and the owner can see it.

Playwright (local Supabase): TOTP enrolment and challenge (code generated in the test), create business, module switch, invite owner (Mailpit), support session, and an aal1 refusal.

## Out of scope
Billing, discounts, the overdue list and reminders, the data protection gate screen (A-Admin; later), template neighbour check, export (later), multiple admins management UI.

## Definition of Done
BUILD_GUIDE.md §2.
