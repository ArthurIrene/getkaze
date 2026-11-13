# Feature 4: Change log view
Module: Content editor   Priority: P1   Preset: both
Decisions: D-011 (every action logged with person and time), D-024, D-034 and ROLES.md §5 (our support access visible to the owner), D-060 (admin at aal2).

Goal: The owner sees who changed what and when on their site, including our support visits; we see the same for every business.

## Screens
- **Owner** `/owner/b/<id>/changes` (hub row "Changes"): newest first, grouped by day, 50 per page ("Older"). Each row: who ("You", "Owner", "Support team"), what in plain words ("Rooms · Garden room: price"), when (Kigali time). Support sessions appear as rows "Support visit started/ended · reason".
- **Admin** `/admin/changes` (aal2): the same list across all businesses with a business filter and the actor's email. Opening a business's editor needs a support session (overview point 2); reading the log does not (overview point 10).

## Data
- `get_change_log(p_business uuid, p_before bigint, p_limit int)`: security definer, returns rows with an actor label; requires `changes.view` on that business or an admin at aal2; the email only for admins. Reads `content_changes` and `support_access`.
- No new tables. Tests: owner of A gets only A's rows and never an email; owner of B with A's id gets nothing; admin at aal1 gets nothing; admin at aal2 gets all with emails.

## Rules in `packages/core` (unit tested)
`describeChange(row)` → plain wording keys per table and field (which fields changed, never full old values for contacts); `groupByDay(rows, "Africa/Kigali")`.

## Acceptance criteria
1. Given the owner saved a room price, then the log shows "You · Rooms · <name>: price · <time>".
2. Given an admin edited during a support session, then the owner sees "Support team" rows inside the visit.
3. Given an owner of B, when they call `get_change_log` with A's id, then nothing comes back.

Playwright: owner change → log row; admin list with filter.
