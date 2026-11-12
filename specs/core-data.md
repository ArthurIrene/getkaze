# Feature: Core data (schema)
Module: Platform core   Priority: P1   Preset: both
Decisions: D-003/D-004 (one database, `business_id` on every row), D-011 (every action logged), D-016/D-043 (presets, property style), D-017 (module switches), D-021 (additive only), D-023 (both prices), D-029 (texts per language), D-033/D-049 (no guest data), D-042 (activities are catalog items), DATA.md §2, §3 and the Chat 2 addendum. ROLES.md and rule 8.
Conflicts: see the overview (rule 8 → `role_permissions`; `click_events` created but not written).

Goal: One schema holds every business's website content safely, so the demo lodge and the first clients are served from the database instead of a file.

Users: none directly. The platform admin, owners and guest pages read and write through RLS (row-level-security.md).

## Migrations (`supabase/migrations/`, plain SQL, additive only)
- `20261112100000_core_schema.sql`: tables, constraints, indexes, `updated_at` triggers.
- `20261112100100_change_log.sql`: change-log triggers.
- `20261112100200_rls.sql` and `20261112100300_public_site.sql` (row-level-security.md).
- File names start with a timestamp. A migration is never edited after it has reached staging; fixes are new files.

## Tables (schema `public`; every business row carries `business_id uuid not null references businesses(id)`)
| Table | Columns (main) | Notes |
|---|---|---|
| `businesses` | `id uuid pk`, `slug text unique` (subdomain; `^[a-z0-9](-?[a-z0-9])*$`, 3–40), `custom_domain text unique null`, `name`, `legal_name`, `preset` (`hotel_lodge` · `restaurant_bar`), `style` (`lodge` · `town_hotel` · `guesthouse` · `restaurant_first` · `bar_first`), `template` (`field-journal`), `status` (`draft` · `active` · `paused`), `default_currency` (`rwf` · `usd`), `languages text[]` (must contain `en`), `created_at`, `updated_at` | `id` *is* the business id. Guest pages show only `active` businesses. |
| `site_settings` | `business_id pk`, `contacts jsonb` (phone, whatsapp, email?), `location jsonb` (map_url, area, distance_note, directions, address), `hours jsonb`, `payment jsonb`, `booking_payments text[]`, `stay jsonb`, `sections jsonb`, `hero jsonb`, `facts jsonb`, `moments jsonb`, `dining jsonb`, `host jsonb`, `reviews jsonb`, `rooms_line jsonb`, `seo_description jsonb`, `published_at timestamptz null`, `updated_at` | One row per business. Owner texts are `LocalizedText` JSON (`{"en": …, "rw": …}`, English required: a check constraint on the key texts). Only *business* contact details (published by the owner), never guest data. |
| `modules` | `id text pk` (`menu`, `ordering`, `booking`, …), `name jsonb`, `presets text[]` | Platform list, seeded by migration. |
| `business_modules` | `business_id`, `module_id`, `enabled bool`, `changed_at`, `changed_by uuid`; pk (`business_id`, `module_id`) | Module switches (D-017). New modules arrive off (D-021). |
| `role_permissions` | `preset`, `role` (`owner` · `manager` · `receptionist` · `housekeeping` · `waiter` · `kitchen` · `bar`), `permission` (`site.view`, `content.edit`, `modules.view`, `members.view`, `stats.view`, `changes.view`); pk of all three | Defaults from ROLES.md §2 (rule 8). A per-business override table comes when staff arrive (P2). |
| `memberships` | `id uuid pk`, `business_id`, `user_id uuid references auth.users`, `roles text[]`, `status` (`invited` · `active` · `disabled`), `invited_by uuid`, `created_at`, `updated_at`; unique (`business_id`, `user_id`) | One person can hold several roles (rule 8). Disabled means no access (instant disable, D-022). |
| `platform_admins` | `user_id uuid pk references auth.users`, `created_at` | Us. Written only by SQL (no API writes). |
| `catalog_items` | `id uuid pk`, `business_id`, `kind` (`room_type` · `dish` · `drink` · `activity` · `service`), `position int`, `visible bool`, `name jsonb`, `line jsonb`, `price_rwf int null`, `price_usd numeric(10,2) null`, `max_guests int null`, `units int null` (room types, for availability later), `amenities jsonb`, `icon text`, `distance jsonb`, `arrange bool`, `group_id uuid null`, `created_at`, `updated_at` | Rooms, dishes and activities in one table (DATA.md §2, D-042). Both prices are entered by hand (D-023); a check requires both or neither. |
| `media` | `id uuid pk`, `business_id`, `item_id uuid null references catalog_items`, `place` (`hero` · `room` · `dining` · `dish` · `host` · `gallery`), `position`, `storage_path text null`, `alt jsonb`, `width`, `height`, `bytes`, `created_at` | Upload and compression come with the editor (Batch 3). `storage_path` null shows a placeholder. |
| `click_events` | `id bigint identity pk`, `business_id`, `kind` (`call` · `whatsapp` · `directions` · `booking_request`), `page text`, `occurred_at` | **No IP, no user agent, no guest data.** Written from Batch 3 (click stats). |
| `content_changes` | `id bigint identity pk`, `business_id`, `actor_id uuid null`, `actor_kind` (`owner` · `staff` · `platform_admin` · `system`), `table_name`, `row_id text`, `action` (`insert` · `update` · `delete`), `changes jsonb` (changed fields only, before and after), `at` | Filled by triggers on `businesses`, `site_settings`, `business_modules`, `memberships`, `catalog_items` and `media` (D-011, D-024). Append-only. |
| `support_access` | `id uuid pk`, `business_id`, `admin_id uuid`, `reason text` (required, 5–200), `started_at`, `ended_at null` | Logged and visible to the owner (ROLES.md §5, D-034). |

Indexes: `business_id` on every business table, `(business_id, kind, position)` on `catalog_items`, `occurred_at` on `click_events`.

## Rules in `packages/core` (unit tested)
- `slugRules`: allowed slug format, reserved slugs (`www`, `admin`, `app`, `api`, `s`, `login`, `owner`, `static`, `mail`) and `normalizeSlug(name)` (e.g. "Kinigi Hills" → `kinigi-hills`).
- `presetDefaults(preset)`: default modules and sections per preset (BUSINESS_TYPES.md; Hotel/Lodge: website, rooms, menu display).
- `rowToSiteData(row)`: maps the public-site JSON (row-level-security.md) to the existing `SiteData` type, with checks (English present, prices both or neither, known enums). It returns errors, not exceptions.

## Data rules
- Every business table has `business_id` and an index on it. A test checks every public table except `modules`, `role_permissions` and `platform_admins`.
- **Additive only:** a CI script (`scripts/check-migrations.mjs`) fails on `DROP TABLE|COLUMN|SCHEMA`, `RENAME`, `ALTER COLUMN … TYPE` and `TRUNCATE` in `supabase/migrations/*.sql`.
- **No guest personal data:** no table holds a guest's name, phone, email or IP (D-033). `memberships` holds owner and staff accounts only (allowed once registration is filed).

## Permissions
Through RLS only (row-level-security.md).

## Module switch
`business_modules` is the switch store. The `menu` module gates "At our table" (as in Batch 1), now read from the database.

## Languages
`LocalizedText` JSON per text; English required (check constraints on hero title, names and room names).

## Acceptance criteria
1. Given a fresh database, when the migrations run, then every table above exists, with `business_id` on every business table and RLS enabled (test).
2. Given the migration check, when a migration contains `DROP COLUMN` or `RENAME`, then CI fails (a fixture file in the script's own test).
3. Given a room type with only a RWF price, when it is inserted, then the check constraint rejects it.
4. Given an update to `catalog_items` by an owner, when it commits, then a `content_changes` row records the actor, the table, the row and the changed fields.
5. Given any table, when its columns are listed, then none is meant for guest personal data (a test checks column names against a deny list: `guest_*`, `ip`, `user_agent`, `phone` outside `contacts`).

## Out of scope
Storage buckets and uploads (Batch 3), bookings and orders (after NCSA), staff logins (P2/P3), billing tables (platform admin billing, P1/P2 per FEATURES.md, later), French routing.

## Definition of Done
Per BUILD_GUIDE.md §2 (migration tested on staging: through the deploy workflow, feature 3).
