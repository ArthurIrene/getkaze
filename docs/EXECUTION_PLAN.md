# EXECUTION_PLAN.md: First two weeks

Status: v1.0 (7 Nov 2026). About 5+ hours per day. Days 15 to 17 are buffer.

## What gets scaffolded first (v0, optional, UI only)
1. Template 1 (warm lodge): home, rooms, contact, mobile view.
2. Editor form screens and owner dashboard with locked module cards.
3. Templates 2 and 3 (modern/minimal, bold safari).
Rule: scaffold output is exported into `apps/web` as plain components. It never touches the database or logic.

## What Claude Code builds
Monorepo, Supabase schema and row-level security, isolation tests, login, module switches, domain and subdomain routing, wiring screens to data, editor logic, photo compression, languages with fallback, click stats, WhatsApp links, SEO, speed, backups. Built in batches (D-052): several features per session, specs approved once, CI green after each feature (D-058), tested on the demo client, committed after each working step.

## Day by day
| Day | Work | Done when |
|---|---|---|
| 1 | Compliance kickoff (COMPLIANCE.md steps 1 to 3), contact a lawyer. Choose platform name, buy domain, DNS on Cloudflare, apply for Cloudflare for Startups. Build a list of 20 Musanze lodges from Google Maps | Registration filed, domain on Cloudflare, list ready |
| 2 | Chat 2 mockups: 3 hotel templates (home, rooms, contact) on phone screens | Mockups approved |
| 3 | Chat 2 mockups: editor, owner dashboard, platform admin, locked modules, a restaurant menu screen for pitches | Mockups approved |
| 4 | Turborepo + pnpm, `apps/web` (Next.js, Tailwind, shadcn/ui, next-intl), `packages/core`, Supabase staging and live, connect Vercel previews | Empty app live on staging |
| 5 | Core data: business, settings, modules, people, roles, catalog items, media, stats, change log; row-level security | Migrations run on staging |
| 6 | Isolation test (A cannot read B); owner login; platform admin 2FA; platform admin: create business, preset, module switches | Test passes; a business can be created |
| 7 | Subdomain routing (business found by host); demo lodge with fake data; review week 1 | Demo lodge opens on its subdomain |
| 8 | Template 1 (scaffold or Claude Code), wired to data: sections on/off, RWF/USD switch, Call and WhatsApp buttons, language fallback | Demo lodge looks real on a phone |
| 9 | Editor part 1: business info, contacts, map, hours, languages, photo upload with compression | Owner edits show live |
| 10 | Editor part 2: rooms with both prices and translations, sections, template and colors, change log | Full site editable from a phone |
| 11 | Templates 2 and 3, wired to the same data | All 3 templates work on the demo |
| 12 | Click stats; booking request via WhatsApp; privacy notice; SEO basics (titles, sitemap, hotel structured data) | Clicks counted; booking message works |
| 13 | Speed pass on slow 3G; PWA manifest; security checklist (headers, PIN lockout, secrets); daily backups on; restore test | Menu and room pages within budget; restore works |
| 14 | Personalized demos for 3 prospects on subdomains + one-page audits; production deploy | 3 demos ready to show |
| 15 to 17 | Buffer for editor overflow; first visits; fix feedback | First pitch done |

## After day 17
- Sell: visits with live demos (D-013), live setup (D-024), Google profile on day one.
- Real clients go live once NCSA registration is filed (owner logins only); move production to Cloudflare first (gate G2).
- Next build slice: menu + WhatsApp orders (Phase 2).

## Chat 2 addendum (2026-11-10)
- Days 2–3 (mockups): done in Chat 2. See docs/MOCKUPS.md.
- Day 8: Field Journal home wired to data. Day 11 changes: instead of templates 2 and 3, build Field Journal rooms, menu display and the Check availability form (launch mode).
- Weeks 3–5: booking system behind the compliance gate, tested on the demo lodge only.

## Batch order (2026-11-12, D-052)
Replaces the day-by-day order above from day 5 on. Days stay as a rough guide for time.
| Batch | Work | Done when |
|---|---|---|
| 0 | Automatic checks: CI (build, lint, typecheck, unit tests, page weight, Playwright), page-weight script, Playwright happy path and hero checks | CI green on the batch PR (done 2026-11-12) |
| 1 | Guest site: rooms, contact, privacy notice, SEO basics, WhatsApp booking message, PWA manifest, speed pass, with Playwright happy paths for new pages | Demo lodge complete on a phone; every page within budget |
| 2 | Data and access: core data and RLS with isolation test, **then a checkpoint**; then owner login (email and password, invite only, D-059), platform admin with TOTP 2FA (D-060), module switches, a minimal owner "Your site" page, subdomain routing, demo lodge in the database, `getSite()` on the database | Isolation test passes; demo lodge served from the database on its subdomain |
| 3 | Editor, owner dashboard, Wording editor (D-061), click stats, security checklist, backups with restore test | Full site editable from a phone; Kinyarwanda fixable without code; restore works |
| Then | Personalized demos for prospects on subdomains + one-page audits | Demos ready to show |
