# CLAUDE.md — read this first (GetKaze)

Multi-business platform for Musanze, Rwanda (hotels, lodges, restaurants, bars). Source of truth: /docs. Feature specs: /specs. Visual reference: /mockups (not app code).

## Core rules (from docs/PROJECT.md section 4)
Source of truth: docs/PROJECT.md. If they differ, PROJECT.md wins.

1. One shared backend and database. Every record carries a `business_id`. Data isolation is enforced by the database (row-level security), not only by code.
2. Features are modules that can be switched on or off per business.
3. A business type is a preset: default modules, wording, roles, and default template.
4. Templates only read data. No client-specific code, ever. Paid custom requests become general modules (on for that client first, offered to others later), or go to Owned or a paid custom front end (D-018).
5. Customization order: settings first, then templates, then paid custom work.
6. Clients own their domain and their data (export on request). We never hold domain or data hostage.
7. Two service models: **Managed** (we host, recurring fee) and **Owned** (one-time price, handover, 3-month support window).
8. Roles are permission settings, not fixed code. One person can hold several roles.
9. Mobile-first, light, and fast. Web (PWA) first for everyone. Native staff app (Expo) later, when time allows (D-037). Guests always use the web, never an app.
10. WhatsApp and MTN MoMo / Airtel Money are first-class.
11. Content: English required; Kinyarwanda and French optional, with English fallback. Platform screens: English and Kinyarwanda, French optional (D-029).
12. Build in small slices. Design everything, build only the sellable core. Paying clients set the order of later features.
13. No client versions: every Managed client runs the latest code. We sell plans. New features arrive switched off; data changes only add (D-021).
14. Guests always pay the business directly. We never hold guest money (D-027).
15. Comply with Rwanda's data protection law (Law No. 058/2021): registration filed before going live; guest data only after storage authorization or on a Rwanda host (D-033, COMPLIANCE.md).
16. All business rules live in the database and `packages/core`, never inside screens, so any future app can connect (D-036).

## Always do
- Run the isolation test (Business A cannot read Business B) before any change that touches data; it must pass.
- Guest data (bookings, customers, stored orders) stays behind the compliance gate (D-049). Do not store it until the gate is open.
- Guest pages: keep to the first-view budget in docs/FEATURES.md section 5 and the light motion kit (D-041). Check page weight before finishing a guest page.

## Stack
TypeScript, Turborepo + pnpm, Next.js (web + PWA), Tailwind, shadcn/ui, next-intl, Zod, Supabase (Postgres, Auth, Storage, Realtime). Vercel previews during build; Cloudflare in production. No Vercel-only features.

## Folders
apps/web (Next.js app) · packages/core (`@getkaze/core`, shared business rules) · docs · specs · mockups · supabase/migrations (planned)

## Commands
Node 22 (`.nvmrc`), pnpm 10 (`corepack enable` picks the pinned version). Run from the repo root:
- Install: `pnpm install`
- Run (dev server, http://localhost:3000): `pnpm dev`
- Build: `pnpm build`
- Run the build: `pnpm start`
- Lint: `pnpm lint`
- Type check: `pnpm typecheck`
- One package only: `pnpm --filter @getkaze/web <script>`
- Test (unit, Vitest in packages/core): `pnpm test`
- Page weight (builds, starts the production server, measures the first view of `/` and `/rw`; fails over 300 KB): `pnpm weight-check` (`--skip-build` after a build)
- End-to-end (Playwright, Chromium, against the production server; run `pnpm build` first): `pnpm e2e`. First time: `pnpm exec playwright install chromium`, or set `PW_CHROMIUM_PATH` to an installed Chromium.
- CI (`.github/workflows/ci.yml`) runs all of the above on every pull request and on pushes to `staging` and `main`.
- Migrate: not set up yet (arrives with Supabase, day 5).

Languages: platform wording lives in `apps/web/messages/<locale>.json` (en required; missing keys fall back to English). Locale routing is set in `apps/web/src/i18n/routing.ts` (English at `/`, Kinyarwanda at `/rw`).
Pinned versions: Next.js, next-intl, Tailwind and shadcn use exact versions (no `^`). shadcn/ui components live in `apps/web/src/components/ui`; `pnpm --filter @getkaze/web exec shadcn add <name>` needs network access to ui.shadcn.com.

## How to work
Start each session: "Read CLAUDE.md and /specs/<feature>.md, then give me a plan before writing code." One feature per branch (`feature/<name>`), commit after each working step, merge to `staging` before `main`. A batch (below) uses one branch (`feature/batch-<n>-<name>`) and replaces the per-feature plan approval with one approval of all its specs.

## Batch mode (D-052)
- A batch is several features in one session.
- Write all specs first, wait for one approval, then build without stopping.
- One commit group per feature. CI must be green after each feature.
- After each feature, update `specs/BATCH_LOG.md`: built, tests, page weight, deviations. A new session resumes from it.
- Stop and ask only for: a conflict with a rule or decision, a migration that removes or renames, a new dependency, a test still failing after three honest tries, or anything touching the live Supabase project.
- Data and security work (row-level security, isolation test) ends with a checkpoint before anything is built on it.

## Never do
- Client-specific code or templates that write data.
- Remove or rename columns in migrations.
- Logic inside screens.
- Secrets in code.
- Handle guest money.
- Vercel-only features.
- Connect tools to the live database with write access.
- Store guest data while the compliance gate is locked.
- Don't use the animation shorthand with scroll-driven timelines; Next's CSS minifier can break it. Use separate animation-* properties.
- Remove the app-wide `noindex` (robots meta, X-Robots-Tag, robots.txt) before gate G2; remove it at G2, per business with real content.
