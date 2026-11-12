-- Core data checks (specs/core-data.md acceptance criteria). Runs with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- Every business table carries business_id (or is businesses) and has an index on it.
select is_empty($$
  select t.tablename from pg_tables t
  where t.schemaname = 'public'
    and t.tablename not in ('businesses', 'modules', 'role_permissions', 'platform_admins', 'reserved_slugs')
    and not exists (select 1 from information_schema.columns c
                    where c.table_schema = 'public' and c.table_name = t.tablename and c.column_name = 'business_id')
$$, 'every business table has business_id');

select is_empty($$
  select c.table_name from information_schema.columns c
  where c.table_schema = 'public' and c.column_name = 'business_id'
    and not exists (
      select 1 from pg_index i
      join pg_class tbl on tbl.oid = i.indrelid
      join pg_attribute a on a.attrelid = tbl.oid and a.attnum = i.indkey[0]
      where tbl.relname = c.table_name and a.attname = 'business_id'
    )
$$, 'every business_id is the first column of an index');

-- No column meant for guest personal data (D-033).
select is_empty($$
  select table_name || '.' || column_name from information_schema.columns
  where table_schema = 'public'
    and (column_name ~ '^guest' or column_name in ('ip', 'ip_address', 'user_agent', 'phone', 'email', 'full_name', 'customer_name'))
$$, 'no guest personal data columns');

-- Fixtures.
insert into public.businesses (id, slug, name, preset, style) values
  ('00000000-0000-0000-0000-0000000000f1', 'schema-test', 'Schema test', 'hotel_lodge', 'lodge');

-- Both prices or neither (D-023); a room type needs prices and capacity.
select throws_ok($$ insert into public.catalog_items (business_id, kind, name, price_rwf) values ('00000000-0000-0000-0000-0000000000f1', 'dish', '{"en": "Soup"}', 3000) $$,
  '23514', null, 'a price in RWF only is rejected');
select throws_ok($$ insert into public.catalog_items (business_id, kind, name) values ('00000000-0000-0000-0000-0000000000f1', 'room_type', '{"en": "Room"}') $$,
  '23514', null, 'a room type without prices or capacity is rejected');
select lives_ok($$ insert into public.catalog_items (business_id, kind, name, price_rwf, price_usd, max_guests) values ('00000000-0000-0000-0000-0000000000f1', 'room_type', '{"en": "Room", "rw": "Icyumba"}', 45000, 35, 2) $$,
  'a complete room type is accepted');

-- English is required in owner texts (D-029).
select throws_ok($$ insert into public.catalog_items (business_id, kind, name) values ('00000000-0000-0000-0000-0000000000f1', 'activity', '{"rw": "Gusura"}') $$,
  '23514', null, 'a name without English is rejected');
select throws_ok($$ insert into public.catalog_items (business_id, kind, name) values ('00000000-0000-0000-0000-0000000000f1', 'activity', '{"en": "Hike", "de": "Wandern"}') $$,
  '23514', null, 'an unknown language key is rejected');

-- Slugs: format and reserved names (D-062).
select throws_ok($$ insert into public.businesses (slug, name, preset, style) values ('Bad Slug', 'X', 'hotel_lodge', 'lodge') $$, '23514', null, 'slug format is enforced');
select throws_ok($$ insert into public.businesses (slug, name, preset, style) values ('www', 'X', 'hotel_lodge', 'lodge') $$, '23514', null, 'reserved slug www is refused');
select throws_ok($$ update public.businesses set slug = 'admin' where id = '00000000-0000-0000-0000-0000000000f1' $$, '23514', null, 'renaming to a reserved slug is refused');
select throws_ok($$ insert into public.businesses (slug, name, preset, style) values ('mixed-up', 'X', 'restaurant_bar', 'lodge') $$, '23514', null, 'a style must fit its preset');

-- A published site needs its key texts.
select throws_ok($$ insert into public.site_settings (business_id, published_at) values ('00000000-0000-0000-0000-0000000000f1', now()) $$,
  '23514', null, 'publishing an empty site is rejected');

-- The change log records inserts and changed fields, and is append-only.
update public.businesses set name = 'Schema test, renamed' where id = '00000000-0000-0000-0000-0000000000f1';
select ok(exists (
  select 1 from public.content_changes
  where table_name = 'businesses' and row_id = '00000000-0000-0000-0000-0000000000f1' and action = 'update'
    and changes -> 'name' ->> 'to' = 'Schema test, renamed' and actor_kind = 'system'
), 'an update is logged with the changed field');
select ok(not exists (
  select 1 from public.content_changes
  where table_name = 'businesses' and action = 'update' and changes ? 'updated_at'
), 'updated_at alone is not logged as a change');
select throws_ok($$ delete from public.content_changes $$, '42501', null, 'the change log cannot be deleted, even by the database owner');

-- A row cannot move to another business.
insert into public.businesses (id, slug, name, preset, style) values ('00000000-0000-0000-0000-0000000000f2', 'schema-two', 'Two', 'hotel_lodge', 'lodge');
select throws_ok($$ update public.catalog_items set business_id = '00000000-0000-0000-0000-0000000000f2' where business_id = '00000000-0000-0000-0000-0000000000f1' $$,
  '23514', null, 'business_id cannot change');

-- Photos only belong to items of the same business.
select throws_ok($$ insert into public.media (business_id, item_id, place, alt)
  select '00000000-0000-0000-0000-0000000000f2', id, 'room', '{"en": "x"}' from public.catalog_items where business_id = '00000000-0000-0000-0000-0000000000f1' limit 1 $$,
  '23503', null, 'media cannot point at another business''s item');

-- The service role can write rows whose checks call the app helpers.
set local role service_role;
select lives_ok($$ insert into public.site_settings (business_id, hero) values ('00000000-0000-0000-0000-0000000000f2', '{"title": {"en": "Hi"}}') $$,
  'service role can write a row checked by app.is_localized');
reset role;

-- Role permissions follow ROLES.md: owners have every permission in both presets.
select is((select count(*) from public.role_permissions where role = 'owner')::int, 12, 'owner has the 6 permissions in both presets');

select * from finish();
rollback;
