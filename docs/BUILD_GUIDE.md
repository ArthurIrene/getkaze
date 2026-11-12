# BUILD_GUIDE.md: How we build, test, and reach the final product

Status: v1.0 (7 Nov 2026). Applies from the first Claude Code session to the last. If this guide and a chat disagree, this guide wins until DECISIONS.md changes it.

## 1. The feature loop (batch mode, D-052)
Features are built in **batches**: several features in one Claude Code session.
1. **Pick:** take the next batch from EXECUTION_PLAN.md (order below). New ideas go to `/specs/backlog.md`, never into the current batch.
2. **Spec:** write `/specs/<feature>.md` for every feature in the batch, using the template in section 6. No spec, no build.
3. **Mockup check:** confirm the screens exist in the Chat 2 mockups. If not, sketch them in the spec.
4. **One approval:** start the session with "Read CLAUDE.md and the batch specs." Claude writes all specs first; the owner approves them once. Then Claude builds without stopping.
5. **Build:** one commit group per feature, on one batch branch (`feature/batch-<n>-<name>`). CI (D-058) must be green after each feature.
6. **Log:** after each feature, update `specs/BATCH_LOG.md`: built, tests, page weight, deviations. A new session resumes from it.
7. **Stop and ask only for:** a conflict with a rule or decision, a migration that removes or renames, a new dependency, a test still failing after three honest tries, or anything touching the live Supabase project.
8. **Checkpoint:** data and security work (row-level security, isolation test) ends with a checkpoint before anything is built on it.
9. **Ship:** one pull request per batch into `staging`; check on staging (getkaze.vercel.app, D-053). `main` stays untouched until gate G2. Features arrive switched off for existing clients.
10. **Record:** update FEATURES.md status, ROADMAP.md, and DECISIONS.md if anything changed.

Batch order:
- **Batch 0, automatic checks:** CI, page-weight check, Playwright (done 2026-11-12).
- **Batch 1, guest site:** rooms, contact, privacy notice, SEO basics, WhatsApp booking message, PWA manifest, speed pass, with Playwright happy paths for new pages.
- **Batch 2, data and access:** core data and RLS with isolation test, then a checkpoint; then login, platform admin with 2FA, module switches, subdomain routing, demo lodge in the database, `getSite()` on the database.
- **Batch 3:** editor, owner dashboard, Wording editor (D-061), click stats, security checklist, backups with restore test.
- **Then:** the prospect demos.

Rule: a batch that runs more than 2 sessions over its plan gets cut down, not stretched.

## 2. Definition of Done (copy into every spec)
- [ ] Acceptance criteria in the spec all pass.
- [ ] Data has `business_id`; row-level security added; isolation test still passes.
- [ ] Module switch works (off = invisible or locked, on = works).
- [ ] Permissions follow ROLES.md.
- [ ] Works on a phone screen (360 px wide) and on desktop.
- [ ] English text complete; Kinyarwanda added for platform screens; fallback works.
- [ ] Guest pages within the speed budget on slow 3G.
- [ ] Database change only adds (no removes or renames); migration tested on staging.
- [ ] Actions logged where the user changes data.
- [ ] Tested on the demo client.
- [ ] Docs updated (FEATURES.md, ROADMAP.md, DECISIONS.md if needed).

## 3. Testing
| Level | What | When |
|---|---|---|
| Database tests | Row-level security: Business A cannot read or change Business B; role permissions | Every feature touching data |
| Unit tests | Rules in `packages/core` (prices, fallback language, module checks, WhatsApp message building) | Every feature with logic |
| End-to-end (Playwright) | One happy path per feature on a phone-sized screen (360x800), Chromium, against the production server (`pnpm e2e`) | Every feature with screens; in CI |
| Manual check | Demo client on a real cheap Android phone, mobile data or throttled to 3G | Before merging to `main` |
| Speed check | First-view weight of guest pages (`pnpm weight-check`, fails over 300 KB) and load time | Every change to guest pages; weight in CI |

Keep tests small. One clear test per rule beats many fragile ones.

## 4. Git and environments
- `main` = live. `staging` = test environment. One branch per feature: `feature/<name>`.
- Never push straight to `main`. Flow: feature branch → `staging` → check → `main`.
- Commit after each working step with a clear message.
- Two Supabase projects (staging, live). Live data never used for testing.
- Build phase: Vercel previews on every push. `staging` is the GitHub default branch and Vercel's production branch (D-053); `main` stays untouched until G2. Production: Cloudflare from gate G2.
- CI on every pull request and on pushes to `staging` and `main`: build, lint, typecheck, unit tests, page weight, Playwright (D-058).

## 4b. Claude connectors (MCP)
- **Supabase:** connect Claude Code to the **staging** project for schema, migrations, logs, and queries. Live project: read-only at most, ideally not connected.
- **Vercel:** deployment status and build logs during the build phase.
- **Cloudflare:** Workers, R2, and DNS once production moves there.
- Every change Claude makes through a connector still goes through the feature loop and Git; no direct live edits.

## 5. Release checklist (every merge to main)
- [ ] Backup taken before any database migration.
- [ ] Migration ran cleanly on staging first.
- [ ] Feature switched off for existing clients by default.
- [ ] Demo client checked on live after release.
- [ ] Short WhatsApp release note for clients who get the feature (only if it affects them).
- [ ] Rollback plan known (previous deploy, backup restore).

## 6. Feature spec template (`/specs/<feature>.md`)
```
# Feature: <name>
Module: <module>   Priority: P1/P2/P3   Preset: Hotel/Lodge, Restaurant & Bar, both
Goal: one sentence on the value to the business.
Users: which roles use it; what guests see.
Screens: list (link to mockups).
Data: concepts touched (from DATA.md); new fields.
Permissions: who can see, create, change, delete.
Module switch: what happens when off.
Languages: texts that need translation.
Acceptance criteria: 3 to 7 testable statements ("Given..., when..., then...").
Out of scope: what this feature does NOT do.
Definition of Done: (paste section 2)
```

## 7. Guidance files inside the repository
- **`CLAUDE.md` (root):** short summary for Claude Code: the 16 core rules, stack, folder layout, commands (run, test, migrate), naming, and a "never do" list (no client-specific code, no data removal in migrations, no logic inside screens, no secrets in code, no guest money handling, no Vercel-only features, never connect tools to the live database with write access).
- **`/docs`:** copies of PROJECT.md, FEATURES.md, ROLES.md, DATA.md, DECISIONS.md, BUILD_GUIDE.md. Updated when the project files change.
- **`/specs`:** one spec per feature, plus `backlog.md`.

## 8. Milestone gates (go to the next phase only when the gate passes)
| Gate | Passes when |
|---|---|
| G0: Ready to build | NCSA registration filed, lawyer contacted, domain bought with DNS on Cloudflare, Chat 2 P1 mockups approved |
| G1: Hotel kit sellable | 3 templates, editor, platform admin, subdomains, click stats, WhatsApp booking, speed and security pass, backups tested, 3 prospect demos ready |
| G2: First real client live | NCSA registration filed, lawyer consult done, consent clause in agreement, move to Cloudflare done, real site live, Google profile started |
| G3: Restaurant entry | Menu + WhatsApp orders and QR table requests live on a real restaurant or hotel with food |
| G4: Operations | Manager orders page used daily by a paying client for 2 weeks without major issues |
| G5: Full platform | Staff, stock, reports, payments Level 1 live for at least one paying client |
| G6: Mobile | Native staff app (when time allows) |

## 9. Weekly rhythm
- **Build days:** 5+ hours, one feature at a time.
- **Once clients exist:** 1 hour a day for support and sales, before building.
- **End of week (30 minutes):** review the week, update ROADMAP.md and DECISIONS.md, pick next week's features, check backups.

## 10. Chat 2 mockup scope (D-038)
Not every screen in full detail. Three levels:

**Full detail (P1, needed now), phone and desktop:**
- 3 templates: home, rooms or menu, contact, language and currency switch.
- Editor: business info, photos, rooms or menu items (both prices, translations), sections, template and colors.
- Owner dashboard: overview, click stats, locked module cards.
- Platform admin: business list, create business, module switches, billing and overdue list.
- Login (owner, platform admin with 2FA).

**Medium detail (P2, needed soon):**
- Guest menu and WhatsApp order flow, QR table request page, booking request form.
- Manager orders page.

**Sketch level (P3, for selling from mockups):**
- One main screen per role: waiter, kitchen, bar, receptionist, housekeeping.
- Staff management, stock, reports.

**States to show once (apply everywhere):** empty, loading, offline banner, error, locked module.

## Chat 2 addendum (2026-11-10)
- **Definition of Done adds:** [ ] Kinyarwanda text checked by a native speaker. [ ] Motion follows the light motion kit (off for reduced motion and data saver).
- **G1 now passes with one template (Field Journal)** plus color sets (D-040).
- Mockups live in /mockups and are listed in docs/MOCKUPS.md. Canvas mockups are visual reference only, not app code.
