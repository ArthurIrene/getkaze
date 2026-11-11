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

## Folders (planned)
apps/web · packages/core · supabase/migrations · docs · specs · mockups

## Commands
To be filled in during the first Claude Code session (run, test, migrate).

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
