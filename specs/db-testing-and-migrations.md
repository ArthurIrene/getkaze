# Feature: How database tests run, and how migrations reach staging
Module: Tooling   Priority: P1
Decisions: D-035 (Supabase), D-053 (staging is the build-phase production), D-058 (CI is the gate), CLAUDE.md "Never do" (no tools with write access to the live database; no secrets in code), D-052 (stop for live Supabase).
Conflicts: the overview, points 2–5 (new CI pieces, sandbox permission, Postgres version, service role key).

Goal: Every push proves the schema, RLS and isolation on a throwaway local Supabase, and only reviewed migrations reach staging, automatically and never the live project.

## Local Supabase in CI (pinned)
- `supabase/config.toml` (from `supabase init`), with `project_id = "getkaze"` and `[db] major_version = <staging's major>` (17 expected; overview point 4).
  - `[auth] enable_signup = false`, `site_url = "http://127.0.0.1:3200"`, and `additional_redirect_urls` for `/auth/callback`.
  - `[auth.mfa.totp] enroll_enabled = true, verify_enabled = true`.
  - Mailpit (the bundled inbox) on. Studio, realtime, storage, edge runtime, analytics and the pooler stay off with `supabase start -x …`.
- CI workflow, new job `db` (before `ci` needs it, or merged into one job; one job keeps one Next build):
  1. `supabase/setup-cli@45a513f8c64c0bc8e0e3dfe572b5c95be85f6359 # v3.0.1` with `version: 2.122.0`.
  2. `supabase start -x studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta`. The CLI pins every container image per CLI version, so pinning the CLI pins Postgres, GoTrue and Mailpit.
  3. `supabase db reset` applies all migrations and `supabase/seed.sql` (the demo lodge, fake data).
  4. `supabase test db` runs the pgTAP files (the isolation test).
  5. `node scripts/check-migrations.mjs` (additive-only check).
  6. Export `supabase status -o env` into the job env as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. These are the CLI's **local default keys** (public, documented), **not secrets**.
  7. Build, lint, typecheck, unit tests, weight check, speed check and Playwright, as today, now against the local Supabase.
- Time: about 1.5–2.5 minutes more per run (image pull; Docker layer cache through the runner).

## Can this sandbox run it?
- **Docker:** yes. I started the daemon; Docker Hub pulls work (`postgres:17.7` pulled, and the `supabase/postgres` and `supabase/gotrue` images are listed).
- **Supabase's default registry (AWS ECR):** blocked by this sandbox's network. The CLI can pull the same images from Docker Hub instead (registry setting), so **no network change is needed**.
- **The Supabase CLI binary:** the download works (GitHub release), but **running it was denied by this session's permission check**. If you allow it (overview point 3a), local runs match CI. If not (3b), I run the SQL tests here on plain `postgres:17.7` with a small `auth` stand-in (`auth.uid()` and `auth.jwt()` reading `request.jwt.claims`, as Supabase does). Auth flows and the full stack are then proven only by the draft PR's CI on each push.

## How migrations reach staging (proposal)
**A GitHub Action, staging only. No Supabase connector, and no tool with write access to live.**
- New workflow `.github/workflows/db-deploy.yml`. It runs `on: push: branches: [staging]` after CI passes (`workflow_run` on CI with `conclusion == success`, `head_branch == staging`), plus `workflow_dispatch` for a manual re-run.
- It uses the GitHub **Environment `supabase-staging`**. You can add yourself as a required reviewer, so every migration waits for your click.
- Steps:
  1. setup-cli (pinned as above).
  2. `supabase link --project-ref "$SUPABASE_PROJECT_REF"`.
  3. `node scripts/check-migrations.mjs`.
  4. `supabase db push --dry-run` (printed in the log).
  5. `supabase db push`, which applies only new migrations.
  6. Optional job `seed-demo` (`workflow_dispatch` only): applies the idempotent demo seed with `supabase db push --include-seed`. The seed upserts fixed UUIDs, so it is safe to re-run.
- **The live project is never named anywhere.** Its ref and keys are not in GitHub. A later live deploy (at G2) gets its own environment and approval.
- `main` stays untouched until G2 (D-053).

## Secrets and variables you add (exact names, and where)
**GitHub** → repository Settings → Environments → **New environment `supabase-staging`** (optionally: Required reviewers = you; Deployment branches = `staging` only):
| Name | Kind | Where to get it |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Environment **secret** | supabase.com → Account → Access Tokens → Generate (name it "github-staging-deploy") |
| `SUPABASE_DB_PASSWORD` | Environment **secret** | The staging project's database password (Project Settings → Database; reset it there if unknown) |
| `SUPABASE_PROJECT_REF` | Environment **variable** | The staging project ref (Project Settings → General, "Project ID", e.g. `abcd1234…`) |

**Vercel** → Project getkaze → Settings → Environment Variables (environments **Production** (= the `staging` branch, D-053) and **Preview**):
| Name | Sensitive | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | Staging Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Staging → API → `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes (Sensitive)** | Staging → API → `service_role` / secret key. Server only, never `NEXT_PUBLIC_` |
| `APP_ROOT_DOMAIN` | no | Leave **unset** for now (no domain yet). Later e.g. `getkaze.rw` |
| `DEMO_SITE_SLUG` | no | `kinigi-hills` |

**Supabase staging dashboard** → Authentication (account settings outside the repo, so you do these; I don't):
- Sign In / Providers → Email: enabled; **Allow new users to sign up: off**.
- Multi-Factor → TOTP: enabled.
- URL Configuration → Site URL `https://getkaze.vercel.app`; Redirect URLs `https://getkaze.vercel.app/auth/callback` and `https://*-irenearthurs-projects.vercel.app/auth/callback` (previews).
- SMTP: leave the built-in sender (testing only, D-059). A custom sender comes before G2.

Nothing goes in the repository except `.env.example` names (no values).

## Acceptance criteria
1. Given a push to the PR, when CI runs, then local Supabase starts at the pinned versions, migrations and seed apply, the isolation test passes, and Playwright runs against it.
2. Given a migration with `DROP COLUMN`, when CI runs, then the check fails before anything is applied.
3. Given a merge to `staging` with a new migration, when CI passes, then `db-deploy` (after your approval, if set) applies only that migration to the staging project, and the log shows the dry run first.
4. Given the repository, when searched, then no Supabase key, password or project ref is in it.

## Out of scope
Live (production) deploys, backups and restore tests (Batch 3), branching (Supabase preview branches; paid).

## Definition of Done
BUILD_GUIDE.md §2 (tooling parts).
