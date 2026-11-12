# Batch 2: data and access (overview)
Status: **specs written, waiting for one approval** (D-052). Branch `feature/batch-2-data-access`, draft PR #6 (CI runs on every push).
Checked against docs/DECISIONS.md (D-001 to D-061), DATA.md, ROLES.md, COMPLIANCE.md, PROJECT.md §4 and CLAUDE.md.
**Checkpoint after features 1–3** (CLAUDE.md, Batch mode): I stop, report and wait for your review before building 4–8.

## Conflicts and open questions (top)
1. **New dependencies (a stop condition).** I need `@supabase/supabase-js` **2.118.0** (2026-10-15) and `@supabase/ssr` **0.12.7** (2026-09-08), both exact versions released at least 14 days ago, in `apps/web` only. Both run on the server only, so no Supabase code reaches guest pages (feature 8 checks this). No Zod: it is in the stack but not installed, so validation stays in plain TypeScript in `packages/core`. **Approve the two packages?**
2. **New CI pieces.**
   - The `supabase/setup-cli` action, pinned to v3.0.1 (`45a513f…`, 2026-09-24; v3.1.0 is only 13 days old).
   - The Supabase CLI itself, **2.122.0** (2026-10-23).
   - A second workflow, `db-deploy.yml`, that pushes migrations to **staging only** (feature 3).
   - **Approve?**
3. **What this sandbox can run** (feature 3).
   - Docker works and Docker Hub pulls work. Supabase's default image registry (AWS ECR) is blocked by the sandbox network.
   - I downloaded the Supabase CLI, but running it was **blocked by this session's permission check**, and I did not try to get around that.
   - **Choose one:**
     - (a) Allow running the pinned Supabase CLI here (a permission rule), with images taken from Docker Hub. This needs no network change.
     - (b) Keep the full Supabase stack in CI only. I would run the SQL isolation tests here on a plain `postgres:17.7` container with a small `auth` stand-in, and rely on the draft PR's CI for auth and the full stack.
   - **I recommend (a)**, so local runs match CI.
4. **The staging project's Postgres major version.** Please read it from Supabase Dashboard → Project Settings → Infrastructure. I will set `major_version` in `supabase/config.toml` to match it; new projects are 17.
5. **Service role key.** Sending an owner invite needs Supabase's admin API, which needs the service role key. It is stored as a **server-only** Vercel variable (never `NEXT_PUBLIC_`), used only in the platform-admin server action, and never in guest pages. **Confirm.**
6. **Rule 8, "Roles are permission settings".** I propose a `role_permissions` table seeded from ROLES.md: preset → role → permission. RLS checks permissions such as `content.edit`, not role names. Only the Owner role is used in this batch.
7. **Cookies.** Login sets Supabase auth cookies only on platform paths (`/login`, `/auth/*`, `/owner`, `/admin`). Guest pages stay cookie-free, and the Batch 1 "no Set-Cookie" test stays as it is.
8. **Fallback before the domain exists** (feature 7). I propose a path, `getkaze.vercel.app/s/<slug>/…`, rather than a query string: a path stays static, cacheable and shareable, and works with canonical URLs. The bare `getkaze.vercel.app` keeps showing the demo lodge (`DEMO_SITE_SLUG`), so D-053 still holds.
9. **First platform admin.** You add the first admin yourself on staging (one SQL line in the Supabase SQL editor; in feature 5). I never touch staging, and no email address is written into the repo.
10. **Built-in email sender.** On hosted Supabase it sends only a few emails per hour, which is enough for testing invites and resets on staging. A custom sender comes before G2 (D-059). Locally and in CI, emails go to the bundled Mailpit inbox, which Playwright reads.
11. **Kinyarwanda for platform screens** (D-029, rule 11). Login, owner and admin wording gets Kinyarwanda drafts, listed in each spec and added to docs/kinyarwanda-glossary.md, all marked draft.
12. **No guest personal data and no compliance-gate tables** in this batch (D-033, D-049). `click_events` stores the kind, page and time only: no IP and no user agent. It is created now and first written in Batch 3.
13. **Staging seeding.** The demo lodge is seeded on staging by the deploy workflow (fake data), not by me.

## Features (one commit group each)
| # | Spec | What |
|---|---|---|
| 1 | [core-data.md](core-data.md) | Plain SQL migrations: businesses, settings, modules, memberships and role permissions, catalog items (room types, dishes, activities), media, click stats, change log, support access log |
| 2 | [row-level-security.md](row-level-security.md) | RLS on every table, helper functions, public read through a single function, and the isolation test |
| 3 | [db-testing-and-migrations.md](db-testing-and-migrations.md) | Local Supabase in CI (pinned), pgTAP tests, the migration path to staging, and the secrets list |
| — | **Checkpoint** | I stop, report and wait for your review |
| 4 | [auth.md](auth.md) | Email and password login, invite only, password reset, sign out |
| 5 | [platform-admin.md](platform-admin.md) | TOTP 2FA, business list, create business, preset, module switches, subdomain, invite owner, logged support access |
| 6 | [owner-your-site.md](owner-your-site.md) | A minimal "Your site" page after login |
| 7 | [business-by-host.md](business-by-host.md) | Subdomain and custom-domain lookup, the `/s/<slug>` fallback, and a clean 404 |
| 8 | [demo-lodge-database.md](demo-lodge-database.md) | Demo lodge seed, `getSite()` from the database, static pages with revalidation |

## Applies to every feature
- Business rules live in `packages/core` or in SQL, never in screens (rule 16). There are unit tests for the core rules, pgTAP tests for SQL, and Playwright where there are screens.
- Migrations only add (D-021). A CI step fails any migration that drops or renames something.
- Nothing touches a live Supabase project. The deploy workflow knows only the staging project.
- Guest pages: no JS growth, the weight check passes, and noindex stays (D-054).
- Platform screens are in English and Kinyarwanda (drafts), phone first. They may use client JS (the budget is for guest pages), but they use only what they need.
