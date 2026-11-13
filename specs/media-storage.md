# Feature 1: Photo storage and its security
Module: Content editor   Priority: P1   Preset: both
Decisions: D-024 (photos compressed, safe limits, changes logged), rule 1 (isolation by the database), D-060 (admin at aal2), D-033 (no guest data). Overview points 2, 3, 8.

Goal: Each business can store its own photos, and no one else can read-list, add, change or remove them.

## Storage
- Bucket `business-media`, created by a migration: public read (overview point 3), `file_size_limit` 300 KB, `allowed_mime_types` `image/webp`, `image/jpeg`.
- Object path: `<business_id>/<photo_id>/<480|960|1440>.<webp|jpg>` (approved point 4: three widths made on the device, served with `<img srcset>`; no image optimizer). Nothing else is accepted (`app.media_business`). `media.storage_path` holds the folder `<business_id>/<photo_id>`.
- **Deleting:** a photo deletes its files, then its row (`deletePhoto`, the owner's session). Deleting a business (D-031) removes its whole folder (`purgeBusinessMedia`). Storage blocks SQL deletes, so both go through the Storage API on the server.

## Policies on `storage.objects` (bucket `business-media` only)
- **Insert:** the first path segment is a business where the user has `content.edit`, or the user is a platform admin with an open support session for it (`app.has_open_support(bid)`, new); the name matches the pattern; the business holds fewer than 180 files (60 photos × 3 widths).
- **Update:** none (photos are replaced by upload + delete, never overwritten).
- **Delete:** the same check as insert, without the count.
- **Select (API listing):** members of the business and admins at aal2. Public file URLs stay readable (public bucket).
- anon: no insert, update or delete.

## Table `media` (exists) — additions only
- Trigger: `storage_path` must be `<business_id>/<uuid>`; at most 60 rows per business; `bytes` (all three files) ≤ 3 × 300 KB.
- New column `translations_checked jsonb default '{}'` (overview point 9) for the alt text.

## Rules in `packages/core`
`photoLimits` (300 KB per file, 60 photos, WebP/JPEG, widths 480/960/1440, targets 40/80/160 KB), `mediaFolder`, `mediaFile`, `mediaBusiness`, `photoFiles`, `photoProblems(file meta)` (type, size, magic bytes WebP/JPEG), `publicMediaUrl(path, config)`. Unit tested.

## Tests (database, pgTAP, extending `isolation.test.sql` and a new `storage.test.sql`)
1. Owner of A uploads `A/<uuid>.webp`: allowed. To `B/…`: refused. A bad name (`A/x.png`, `A/../B/x.webp`, no folder): refused.
2. Owner of A cannot list or delete B's objects; anon cannot insert or delete.
3. Admin at aal1: refused. Admin at aal2 without a support session: refused; with one: allowed.
4. The 61st object in A: refused. A `media` row pointing to `B/…` from business A: refused.
5. Bucket limits as set (size and types), so a 301 KB file or a PNG is refused by Storage itself (Playwright `e2e/media-storage.spec.ts`, through the Storage API, with photo and business-folder deletion).
6. `pnpm db:check` keeps `photoLimits` equal to `app.media_limits` and the bucket.

Editor hint (feature 2): "Don't upload photos of guests without their consent."

## Acceptance criteria
- Given an owner of A, when they upload a WebP under 300 KB, then it is stored under `A/` and readable at its public URL.
- Given an owner of A, when they try any write under `B/`, then it is refused by the database (tests above).

## CHECKPOINT
After this feature I stop with a short report (policies, test results from CI) before the editor is built on it.

## Accepted risk (checkpoint, 2026-11-13)
Photos of a paused business stay reachable by direct link until deletion at day 90 (D-031): the bucket is public, paths are random UUIDs, and there is no public listing. Accepted.
