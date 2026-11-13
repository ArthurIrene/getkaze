# Demo photos (Kinigi Hills demo)

Plan approved 2026-11-13. Shot list and sources: SHOTLIST.md. Credits: CREDITS.md.

## What
About 14 openly licensed photos (CC0, Public Domain Mark or CC BY only) for the fake demo lodge: hero, life strip, rooms (one or two each), dining and around us. Gallery stays unshown. No faces (wildlife photos included), no logos, no real hotel or lodge.

## Files
`apps/web/public/demo-photos/<name>/<480|960|1440>.webp`, made by `scripts/demo-photos.mjs` with the editor's rules from `packages/core/src/media.ts` (`photoLimits`, `widthsFor`): WebP, no upscaling, quality stepped to 40 / 80 / 160 KB, each file under 300 KB, EXIF dropped. The script also writes `apps/web/src/data/demo-photos.ts`.

## Data
- Bundled demo (`demo-lodge.ts`) and seed (`gen-demo-seed.mjs`, checked by `pnpm db:check`) use the same photos.
- `media.source`: `storage` (default, uploads) or `static` (files bundled with the app at `/demo-photos/<name>/`). **`static` is seed-only:** the database refuses it, and any change to a static photo's path, from every request with a JWT (owners, admins, even the service role); only migrations and seed data (no JWT) write it. The same rule covers photos inside `site_settings` JSON (hero, moments, dining, host): a request with a JWT may keep the seed's static photos but never add or change one. Tests: `storage.test.sql`.
- `media.credit`: title, photographer name, source link, licence, licence link. **It holds only public photographer names, links and licences — no personal data.** Checked by `app.is_credit` (licences: cc0, pdm, cc-by-2.0/2.5/3.0/4.0; https links only).
- `get_published_site` returns `source` and `credit` per photo. The locked-fields test (`public_site_fields.test.sql`) was updated deliberately to the new list.
- Core builds static URLs (`staticPhotoUrls`) the same way as Storage URLs: plain `<img srcset>`, no image optimizer.

## Credits page
`/credits` ("Photo credits"; Kinyarwanda title "Abafashe amafoto", draft; body in English): every credited photo with what it shows, title (linked to the source), photographer and licence (linked). The footer links to it, and the page exists, only when the site has credited photos (core `sitePages`).

## Checks
Weight check on every page with the hero photo (budget 300 KB); photos below the fold lazy-load; Playwright: images load, the credits page lists every CC BY photo. Total size of the photo files in the repo is reported in BATCH_LOG.
