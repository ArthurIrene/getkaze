# CLAUDE.md — read this first (GetKaze)

Multi-business platform for Musanze, Rwanda (hotels, lodges, restaurants, bars). Source of truth: /docs. Feature specs: /specs. Visual reference: /mockups (not app code).

## Core rules (short)
1. One shared database; every row has `business_id`; row-level security enforces isolation; isolation test must pass.
2. Features are modules switched per business; new modules arrive switched off.
3. Business type = preset (modules, wording, roles, template); property style / venue style are settings.
4. Templates only read data. No client-specific code, ever.
5. Business rules live in the database and `packages/core`, never inside screens.
6. Data changes only add (no removes or renames in migrations).
7. Guests always pay the business directly; we never hold guest money.
8. Guest data (bookings, guest lists, stored orders) only behind the compliance gate (D-033, D-049).
9. Mobile-first, light pages: about 300 KB first view on slow 3G; light motion kit only (D-041).
10. English required; Kinyarwanda and French optional with English fallback.

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
- Test, migrate: not set up yet (arrive with Supabase, day 5–6).

Languages: platform wording lives in `apps/web/messages/<locale>.json` (en required; missing keys fall back to English). Locale routing is set in `apps/web/src/i18n/routing.ts` (English at `/`, Kinyarwanda at `/rw`).
Pinned versions: Next.js, next-intl, Tailwind and shadcn use exact versions (no `^`). shadcn/ui components live in `apps/web/src/components/ui`; `pnpm --filter @getkaze/web exec shadcn add <name>` needs network access to ui.shadcn.com.

## How to work
Start each session: "Read CLAUDE.md and /specs/<feature>.md, then give me a plan before writing code." One feature per branch (`feature/<name>`), commit after each working step, merge to `staging` before `main`.

## Never do
- Client-specific code or templates that write data.
- Remove or rename columns in migrations.
- Logic inside screens.
- Secrets in code.
- Handle guest money.
- Vercel-only features.
- Connect tools to the live database with write access.
- Store guest data while the compliance gate is locked.
