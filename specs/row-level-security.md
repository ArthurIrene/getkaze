# Feature: Row-level security and the isolation test
Module: Platform core (security)   Priority: P1   Preset: both
Decisions: rule 1 (isolation enforced by the database), D-004, D-011, D-034 (RLS with isolation test, logged support access), **D-060** (admin data requires aal2), D-033/D-049. CLAUDE.md "Always do": run the isolation test before any data change.
Conflicts: none. **Checkpoint after this, feature 1 and feature 3.**

Goal: The database itself guarantees that a business sees only its own data, owners only their own business, admins only with 2FA, and guests only published content of active businesses.

## Principles
- `alter table … enable row level security` **and** `force row level security` on every table in `public`. A test fails if any table lacks either.
- Revoke everything from `anon` and `authenticated` on all tables, then grant back table by table (least privilege). `anon` gets **no** table privileges at all.
- Helper functions live in a private schema `app` (not exposed by the API). They are `security definer`, `stable` and `set search_path = ''`:
  - `app.is_member(bid uuid)`: an active membership for `auth.uid()` exists.
  - `app.has_permission(bid uuid, perm text)`: an active membership with a role whose `role_permissions` (for the business's preset) include `perm`.
  - `app.is_platform_admin()`: `(auth.jwt() ->> 'aal') = 'aal2'` **and** a `platform_admins` row exists for `auth.uid()`. **With aal1 (no TOTP yet), an admin has no admin rights** (D-060).
- Policies use `(select auth.uid())` (evaluated once per query) and the helpers.

## Policies (authenticated role; anon has none)
| Table | Select | Insert | Update | Delete |
|---|---|---|---|---|
| `businesses` | member of it, or admin | admin | admin (owners edit content tables, not status, slug or preset) | none (status `paused` instead) |
| `site_settings` | member, or admin | admin | `content.edit` on that business, or admin | none |
| `catalog_items`, `media` | member, or admin | `content.edit`, or admin | `content.edit`, or admin | `content.edit`, or admin |
| `business_modules` | member, or admin | admin | admin | none |
| `modules`, `role_permissions` | any signed-in user | none | none | none |
| `memberships` | own rows; `members.view` on that business; admin | admin (invite) | admin | none (status `disabled`) |
| `platform_admins` | own row | none (SQL only) | none | none |
| `click_events` | `stats.view`, or admin | none (Batch 3 adds a server path) | none | none |
| `content_changes` | `changes.view`, or admin | none (triggers only, `security definer`) | none | none |
| `support_access` | admin; owners (`changes.view`) of that business | admin, with `admin_id = auth.uid()` | admin, only to set `ended_at` on their own row | none |

`business_id` can never be changed by an update (a trigger rejects it), so a row cannot be moved into another business.

## Public read for guest pages (anonymous visitors)
**Proposal: one door, a function, not table access.**
- `public.get_published_site(p_slug text default null, p_host text default null) returns jsonb`, `security definer`, `stable`. `anon` and `authenticated` get `execute` on it and nothing else.
- It returns a site only when `businesses.status = 'active'` and `site_settings.published_at is not null`. The lookup is by `slug` or by exact `custom_domain`.
- It returns **only** the published site fields: business name, legal name, template, style, currency, languages, contacts (business contact details only), location, hours, payment, booking payments, stay, sections, hero, facts, moments, dining, host, reviews, `seo_description`, enabled module ids, visible catalog items (no ids of users) and media (path and alt).
- It **never** returns memberships, user ids, change log, click events, support access, `custom_domain` of others, or draft or paused businesses.
- It returns `null` for unknown, draft or paused, so the page can return a clean 404.
- `public.list_published_slugs() returns setof text`, also `security definer`, `stable` and anon-executable, lists active and published slugs only, for static generation and the sitemap.
- Why: anonymous users never touch tables, so a missed policy cannot leak, the returned fields are explicit, and `getSite()` becomes one call.

### Fields returned by `get_published_site` (exact; locked by `public_site_fields.test.sql`)
Both public functions are `security definer` with `set search_path = ''`, and every name inside is schema-qualified (`public.…`). The test fails if any field below is added, removed or renamed.
| Level | Fields |
|---|---|
| top | `business`, `settings`, `modulesOn`, `items`, `media` |
| `business` | `id`, `slug`, `name`, `legalName`, `preset`, `style`, `template`, `defaultCurrency`, `languages` |
| `settings` | `contacts`, `location`, `hours`, `payment`, `bookingPayments`, `stay`, `sections`, `hero`, `facts`, `moments`, `dining`, `host`, `reviews`, `roomsLine`, `seoDescription`, `publishedAt` |
| `settings.contacts` | `phone`, `whatsapp`, `email`: the **business's** published contact details only. Any other key stored in `contacts` is dropped. |
| `items[]` | `id`, `kind`, `position`, `name`, `line`, `priceRwf`, `priceUsd`, `maxGuests`, `amenities`, `icon`, `distance`, `arrange` (visible items only) |
| `media[]` | `id`, `itemId`, `place`, `position`, `path`, `alt`, `width`, `height` (only for visible items, or not tied to an item) |
| `modulesOn` | the ids of enabled modules |

`custom_domain`, `status`, member, user, owner, log and support data are never returned. The test also checks that an owner's email and an unlisted contact key never appear anywhere in the output.

### Deleting a business's change log (the one controlled path)
- `public.admin_delete_change_log(p_business_id, p_reason)` exists for D-031 (deletion at day 90) and data-deletion rights (COMPLIANCE.md §4). It is `security definer`, `search_path = ''`.
- **Platform admin with aal2 only**; anyone else, including an admin with aal1, gets `insufficient_privilege`. A reason of 5 or more characters is required.
- It deletes every `content_changes` row of that business and returns the count, then **writes a `support_access` row** ("Change log deleted (N rows): reason", started and ended now). It never deletes `support_access`.
- **Normal use stays append-only:** the guard trigger lets a delete through only inside this function (its owner as `current_user`, plus a transaction-local flag). Owners, admins, the service role and the database owner still cannot update or delete log rows directly; setting the flag by hand opens nothing.
- Tests: `change_log.test.sql` (admin aal2 deletes A's rows only and B's stay; the support-access record exists; owner, admin aal1, anon and the service role are refused; direct edits and deletes are refused for everyone; logging continues afterwards).

## Isolation test (pgTAP, `supabase/tests/database/*.test.sql`, runs with `supabase test db`)
Fixtures inside a transaction:
- Business **A** (active, published) and business **B** (active, published), with a third business **C** (draft).
- User **ownerA** (owner of A) and user **ownerB** (owner of B).
- User **admin**, tested as aal1 and as aal2.
- One disabled membership (owner of A, disabled).
- Each role is simulated with `set local role authenticated` and `set local request.jwt.claims = '{"sub": …, "aal": …}'`.

Assertions:
1. **A cannot read B:** as ownerA, `select` on every business table returns no B rows. The test loops over every table with `business_id`, so a new table is covered automatically.
2. **A cannot change B:** as ownerA, insert, update and delete on B rows affect 0 rows or raise, on every business table. Moving a row (setting `business_id` = B) is rejected.
3. **Owners only their own business:** ownerA reads and edits A's content. The disabled member reads nothing.
4. **Owners cannot do admin things:** ownerA cannot change `businesses.status` or `slug`, `business_modules`, or `memberships`, and cannot insert `platform_admins`.
5. **Admin needs aal2:** admin with aal1 reads no business rows and cannot write. With aal2 it reads and writes A, B and C.
6. **Anon:** `select` on every table is denied (permission error). `get_published_site('a')` returns A's JSON. `'c'` (draft), an unknown slug and a paused business return `null`.
7. **No personal data in the public JSON:** the JSON for A contains none of the keys `user_id`, `memberships`, `email` outside `contacts`, `changes` or `support`; a recursive key check.
8. **Logs:** `content_changes` rows appear for owner edits. Nobody can update or delete them, not even the admin.
9. **Meta:** every table in `public` has RLS enabled and forced, and `anon` holds no table privileges.

Run: in CI on every push (db-testing-and-migrations.md), and locally before any data change (CLAUDE.md).

## Acceptance criteria
1. Given the isolation test, when it runs, then all nine groups above pass.
2. Given a new table added without RLS, when the tests run, then the meta test fails.
3. Given a platform admin without a TOTP-verified session, when they query admin data, then they get no rows.
4. Given an anonymous visitor, when the guest site loads, then data comes only from `get_published_site` and contains no personal data.

## Out of scope
Staff roles beyond Owner (P2), per-business permission overrides, rate limits on the public function (Cloudflare at G2), guest data tables (after NCSA).

## Definition of Done
BUILD_GUIDE.md §2. The isolation test is the gate for every later data change.
