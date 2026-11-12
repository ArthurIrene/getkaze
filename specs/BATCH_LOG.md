# BATCH_LOG.md

Batch mode (D-052): after each feature, add a short entry here. A new session resumes from the last entry.

Entry format:

```
## Batch <n>, <feature> | <date>
- Built:
- Tests: (unit, Playwright, CI run)
- Page weight: (first view of / and /rw from `pnpm weight-check`, JS separately)
- Deviations: (from the spec, and why)
- Next:
```

## Batch 0, automatic checks and docs | 2026-11-12
- Built: CI workflow (`.github/workflows/ci.yml`: build, lint, typecheck, unit tests, page weight, Playwright on every PR and on pushes to staging and main); `scripts/weight-check.mjs`; Playwright (`@playwright/test` 1.64.1, Chromium) with `e2e/home.spec.ts` and `e2e/hero.spec.ts`; batch mode in CLAUDE.md; D-052 to D-058; BUILD_GUIDE §1, PROJECT §10, EXECUTION_PLAN and COMPLIANCE updated.
- Tests: 22 unit tests; 3 Playwright tests (home happy path, hero card after the pin, reduced-motion card). The hero test was checked to fail when the `animation: linear both` shorthand comes back.
- Page weight: `/` 164.2 KB and `/rw` 164.3 KB transferred (budget 300 KB). JS 144.9 KB transferred in 7 files on both (reported, not enforced).
- Deviations: no spec file (tooling and docs only). The JS number: earlier PRs reported 147.7 KB (browser counter, headers included) and 187.8 KB (every file in `.next/static/chunks` gzipped, including the 112 KB `noModule` polyfill file that modern browsers never download). The weight check counts only what the browser downloads, body bytes only.
- Next: Batch 1, guest site (see EXECUTION_PLAN.md).

## Batch 1, guest site: specs | 2026-11-12
- Built: specs only. They are specs/batch-1-guest-site.md (overview, conflicts, Kinyarwanda list), rooms-page.md, contact-page.md, site-navigation.md, privacy-notice.md, seo-basics.md, booking-request.md, pwa-manifest.md and speed-pass.md. field-journal-template.md now points part 2 to them.
- Tests: none yet.
- Page weight: unchanged (Batch 0: 161.8 KB in CI).
- Deviations: none yet. Conflicts and choices are listed at the top of batch-1-guest-site.md.
- Next: wait for one approval, then build in the order 3 → 1 → 2 → 6 → 4 → 5 → 7 → 8.
