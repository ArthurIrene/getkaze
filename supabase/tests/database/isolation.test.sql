-- Isolation test (specs/row-level-security.md). Runs with `supabase test db`.
-- Business A can never read or change business B; owners only their own
-- business; platform admin needs aal2 (D-060); anon reads only through
-- get_published_site. Everything runs in one transaction and is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- ---------- Fixtures (as postgres, which bypasses RLS) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.test'),
  ('00000000-0000-0000-0000-0000000000d1', 'disabled@example.test'),
  ('00000000-0000-0000-0000-0000000000e1', 'stranger@example.test');

insert into public.businesses (id, slug, custom_domain, name, legal_name, preset, style, status, languages) values
  ('00000000-0000-0000-0000-00000000000a', 'biz-a', 'lodge-a.example.test', 'Lodge A', 'Lodge A Ltd', 'hotel_lodge', 'lodge', 'active', array['en', 'rw']),
  ('00000000-0000-0000-0000-00000000000b', 'biz-b', null, 'Lodge B', 'Lodge B Ltd', 'hotel_lodge', 'guesthouse', 'active', array['en']),
  ('00000000-0000-0000-0000-00000000000c', 'biz-c', null, 'Draft C', '', 'restaurant_bar', 'bar_first', 'draft', array['en']),
  ('00000000-0000-0000-0000-00000000000d', 'biz-p', null, 'Paused P', '', 'hotel_lodge', 'lodge', 'paused', array['en']);

insert into public.site_settings (business_id, contacts, location, hero, booking_payments, published_at)
select id,
  jsonb_build_object('phone', '+250 700 000 001', 'whatsapp', '+250 700 000 002', 'email', 'hello@' || slug || '.example.test'),
  '{"map_url": "https://maps.example.test"}'::jsonb,
  '{"title": {"en": "Welcome"}}'::jsonb,
  array['lodge'],
  case when status = 'draft' then null else now() end
from public.businesses
where slug in ('biz-a', 'biz-b', 'biz-c', 'biz-p');

insert into public.business_modules (business_id, module_id, enabled) values
  ('00000000-0000-0000-0000-00000000000a', 'menu', true),
  ('00000000-0000-0000-0000-00000000000b', 'menu', true);

insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', array['owner'], 'active'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', array['owner'], 'disabled');

insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');

insert into public.catalog_items (id, business_id, kind, name, price_rwf, price_usd, max_guests) values
  ('00000000-0000-0000-0000-0000000001a0', '00000000-0000-0000-0000-00000000000a', 'room_type', '{"en": "Room A"}', 60000, 45, 2),
  ('00000000-0000-0000-0000-0000000001b0', '00000000-0000-0000-0000-00000000000b', 'room_type', '{"en": "Room B"}', 50000, 40, 2),
  ('00000000-0000-0000-0000-0000000001b9', '00000000-0000-0000-0000-00000000000b', 'room_type', '{"en": "Hidden B"}', 1, 1, 1);
update public.catalog_items set visible = false where id = '00000000-0000-0000-0000-0000000001b9';

insert into public.media (business_id, item_id, place, alt) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000001a0', 'room', '{"en": "Room A photo"}'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000001b0', 'room', '{"en": "Room B photo"}');

insert into public.click_events (business_id, kind, page) values
  ('00000000-0000-0000-0000-00000000000a', 'call', '/'),
  ('00000000-0000-0000-0000-00000000000b', 'whatsapp', '/rooms');

insert into public.support_access (business_id, admin_id, reason) values
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000ad', 'Fixing the hero text');

-- Every business table (has business_id, or is businesses itself), for the generic checks.
create temp table business_tables on commit drop as
  select c.table_name::text as t,
    case when c.table_name = 'businesses' then 'id' else 'business_id' end as col
  from information_schema.columns c
  where c.table_schema = 'public'
    and (c.column_name = 'business_id' or (c.table_name = 'businesses' and c.column_name = 'id'))
  group by c.table_name;
create temp table all_tables on commit drop as
  select tablename::text as t from pg_tables where schemaname = 'public';
grant select on business_tables, all_tables to authenticated, anon;

-- Test helpers (run as the caller, so RLS applies).
create schema tests;
grant usage on schema tests to authenticated, anon;
create function tests.count_rows(tbl text, col text, bid uuid) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from public.%I where %I = $1', tbl, col) into n using bid;
  return n;
end $$;
-- Rows changed by a no-op update or by a delete of another business's rows; -1 when refused outright.
create function tests.try_update(tbl text, col text, bid uuid) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute format('update public.%I set %I = %I where %I = $1', tbl, col, col, col) using bid;
  get diagnostics n = row_count;
  return n;
exception when insufficient_privilege then return -1;
end $$;
create function tests.try_delete(tbl text, col text, bid uuid) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute format('delete from public.%I where %I = $1', tbl, col) using bid;
  get diagnostics n = row_count;
  return n;
exception when insufficient_privilege then return -1;
when others then return -2; -- e.g. append-only trigger
end $$;
create function tests.exec_count(sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute sql;
  get diagnostics n = row_count;
  return n;
exception when insufficient_privilege then return -1;
end $$;
-- Every key path in a JSON document, e.g. settings.contacts.email.
create function tests.json_paths(doc jsonb) returns setof text language sql as $$
  with recursive walk(path, value) as (
    select e.k, e.v from jsonb_each(doc) as e(k, v)
    union all
    select w.path || x.suffix, x.v
    from walk w
    cross join lateral (
      select '.' || e.k as suffix, e.v
      from jsonb_each(case when jsonb_typeof(w.value) = 'object' then w.value else '{}'::jsonb end) as e(k, v)
      union all
      select '[]', a.v
      from jsonb_array_elements(case when jsonb_typeof(w.value) = 'array' then w.value else '[]'::jsonb end) as a(v)
    ) x
  )
  select path from walk
$$;
grant execute on all functions in schema tests to authenticated, anon;

-- ================= 9. Meta: every table has RLS on and forced; anon holds no table privileges =================
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity) $$,
  'every public table has RLS enabled and forced'
);
select is_empty(
  $$ select table_name from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' $$,
  'anon holds no privileges on any public table'
);
select ok((select count(*) from business_tables) >= 9, 'business tables were found for the generic checks');

-- ================= 1 and 2. Owner A cannot read or change business B =================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);

select is(tests.count_rows(t, col, '00000000-0000-0000-0000-00000000000b'), 0::bigint, format('owner A reads no %s rows of B', t))
from business_tables;
select cmp_ok(tests.try_update(t, col, '00000000-0000-0000-0000-00000000000b'), '<=', 0::bigint, format('owner A updates no %s rows of B', t))
from business_tables;
select cmp_ok(tests.try_delete(t, col, '00000000-0000-0000-0000-00000000000b'), '<=', 0::bigint, format('owner A deletes no %s rows of B', t))
from business_tables;

select throws_ok(
  $$ insert into public.catalog_items (business_id, kind, name) values ('00000000-0000-0000-0000-00000000000b', 'dish', '{"en": "Intruder"}') $$,
  '42501', null, 'owner A cannot insert catalog items into B');
select throws_ok(
  $$ insert into public.media (business_id, place, alt) values ('00000000-0000-0000-0000-00000000000b', 'gallery', '{"en": "x"}') $$,
  '42501', null, 'owner A cannot insert media into B');
select throws_ok(
  $$ insert into public.memberships (business_id, user_id, roles, status) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active') $$,
  '42501', null, 'owner A cannot make themselves a member of B');
select throws_ok(
  $$ update public.catalog_items set business_id = '00000000-0000-0000-0000-00000000000b' where id = '00000000-0000-0000-0000-0000000001a0' $$,
  null, null, 'owner A cannot move an item into B');

-- ================= 3. Owners work on their own business =================
select ok(tests.count_rows('catalog_items', 'business_id', '00000000-0000-0000-0000-00000000000a') = 1, 'owner A reads A''s items');
select is(tests.exec_count($$ update public.catalog_items set name = '{"en": "Room A, renamed"}' where id = '00000000-0000-0000-0000-0000000001a0' $$),
  1::bigint, 'owner A edits A''s item');
select is(tests.exec_count($$ update public.site_settings set rooms_line = '{"en": "two rooms"}' where business_id = '00000000-0000-0000-0000-00000000000a' $$),
  1::bigint, 'owner A edits A''s site settings');
select is(tests.count_rows('support_access', 'business_id', '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'owner A sees no support visits of A yet');

-- ================= 4. Owners cannot do admin things =================
select is(tests.exec_count($$ update public.businesses set status = 'paused' where id = '00000000-0000-0000-0000-00000000000a' $$), 0::bigint, 'owner cannot change business status');
select is(tests.exec_count($$ update public.businesses set slug = 'stolen' where id = '00000000-0000-0000-0000-00000000000a' $$), 0::bigint, 'owner cannot change the slug');
select is(tests.exec_count($$ update public.business_modules set enabled = false where business_id = '00000000-0000-0000-0000-00000000000a' $$), 0::bigint, 'owner cannot flip module switches');
select is(tests.exec_count($$ update public.memberships set roles = array['owner', 'manager'] where business_id = '00000000-0000-0000-0000-00000000000a' $$), 0::bigint, 'owner cannot edit memberships');
select throws_ok($$ insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000a1') $$, '42501', null, 'owner cannot become platform admin');
select throws_ok($$ insert into public.businesses (slug, name, preset, style) values ('new-biz', 'New', 'hotel_lodge', 'lodge') $$, '42501', null, 'owner cannot create businesses');
select is(tests.exec_count($$ update public.site_settings set published_at = now() where business_id = '00000000-0000-0000-0000-00000000000b' $$), 0::bigint, 'owner A cannot publish B');

-- ================= 8. Logs =================
reset role;
select ok(exists (
  select 1 from public.content_changes
  where table_name = 'catalog_items' and row_id = '00000000-0000-0000-0000-0000000001a0' and action = 'update'
    and actor_id = '00000000-0000-0000-0000-0000000000a1' and actor_kind = 'owner'
    and changes ? 'name'
), 'owner edit is in the change log with actor and changed field');

-- Owner B sees B's support visit; owner A does not.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.count_rows('support_access', 'business_id', '00000000-0000-0000-0000-00000000000b'), 1::bigint, 'owner B sees the support visit on B');
select is(tests.count_rows('catalog_items', 'business_id', '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'owner B reads nothing of A');

-- Disabled member and a stranger see nothing.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.count_rows(t, col, '00000000-0000-0000-0000-00000000000a'), 0::bigint, format('disabled member reads no %s rows', t)) from business_tables;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated", "aal": "aal2"}', true);
select is(tests.count_rows('businesses', 'id', '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'a stranger with aal2 reads nothing');

-- ================= 5. Admin needs aal2 =================
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.count_rows(t, col, '00000000-0000-0000-0000-00000000000b'), 0::bigint, format('admin with aal1 reads no %s rows', t)) from business_tables;
select is(tests.exec_count($$ update public.businesses set status = 'paused' where id = '00000000-0000-0000-0000-00000000000b' $$), 0::bigint, 'admin with aal1 cannot change a business');
select throws_ok($$ insert into public.businesses (slug, name, preset, style) values ('aal1-biz', 'X', 'hotel_lodge', 'lodge') $$, '42501', null, 'admin with aal1 cannot create a business');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
select is(tests.count_rows('businesses', 'id', bid), 1::bigint, 'admin with aal2 reads business ' || bid)
from unnest(array['00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c']::uuid[]) bid;
select lives_ok($$ insert into public.businesses (slug, name, preset, style) values ('aal2-biz', 'New lodge', 'hotel_lodge', 'lodge') $$, 'admin with aal2 creates a business');
select throws_ok($$ insert into public.businesses (slug, name, preset, style) values ('kaze', 'Reserved', 'hotel_lodge', 'lodge') $$, '23514', null, 'a reserved slug is refused');
select is(tests.exec_count($$ update public.business_modules set enabled = false where business_id = '00000000-0000-0000-0000-00000000000b' $$), 1::bigint, 'admin with aal2 flips a module switch');
select lives_ok($$ insert into public.support_access (business_id, admin_id, reason) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ad', 'Checking prices') $$, 'admin opens a support session for themselves');
select throws_ok($$ insert into public.support_access (business_id, admin_id, reason) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b1', 'Pretending') $$, '42501', null, 'admin cannot log a support session as someone else');
select throws_ok($$ update public.content_changes set action = 'insert' $$, '42501', null, 'admin cannot edit the change log');
select throws_ok($$ delete from public.content_changes $$, '42501', null, 'admin cannot delete the change log');

-- ================= 6. Anon =================
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok(format('select 1 from public.%I limit 1', t), '42501', null, format('anon cannot select %s', t)) from all_tables;
select ok(public.get_published_site('biz-a') is not null, 'anon gets the published site of an active business');
select is(public.get_published_site('biz-a') -> 'business' ->> 'name', 'Lodge A', 'by slug');
select is(public.get_published_site(null, 'lodge-a.example.test') -> 'business' ->> 'slug', 'biz-a', 'by custom domain');
select is(public.get_published_site('BIZ-A') -> 'business' ->> 'slug', 'biz-a', 'slug lookup ignores case');
select ok(public.get_published_site('biz-c') is null, 'draft business: null');
select ok(public.get_published_site('biz-p') is null, 'paused business: null');
select ok(public.get_published_site('nope') is null, 'unknown slug: null');
select ok(public.get_published_site() is null, 'no slug and no host: null');
select is(jsonb_array_length(public.get_published_site('biz-b') -> 'items'), 1, 'hidden items are not published');
select is(public.get_published_site('biz-a') -> 'modulesOn', '["menu"]'::jsonb, 'enabled modules are published');
select results_eq($$ select s from public.list_published_slugs() s where s in ('biz-a', 'biz-b', 'biz-c', 'biz-p') $$, $$ values ('biz-a'), ('biz-b') $$, 'only active, published slugs are listed');

-- ================= 7. No personal data in the public JSON =================
reset role;
select is_empty(
  $$ select p from tests.json_paths(public.get_published_site('biz-a')) p
     where p ~ '(^|\.)(user_id|roles|memberships|invited_by|admin_id|actor_id|actor_kind|changes|reason|status|custom_domain)$'
        or (p ~ '(^|\.)email$' and p <> 'settings.contacts.email') $$,
  'the public site JSON holds no account, log or private fields'
);

-- ================= 10. Storage: owner A cannot read or write B's photo files (media-storage.md; more in storage.test.sql) =================
reset role;
select set_config('storage.allow_delete_query', 'true', true);
insert into storage.objects (bucket_id, name) values
  ('business-media', '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f1/960.webp');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is((select count(*) from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%'), 0::bigint, 'owner A lists none of B''s files');
select is(tests.exec_count($$ insert into storage.objects (bucket_id, name) values ('business-media', '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f2/480.webp') $$), -1::bigint, 'owner A cannot add a file to B');
select is(tests.exec_count($$ delete from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%' $$), 0::bigint, 'owner A deletes none of B''s files');
select is(tests.exec_count($$ insert into storage.objects (bucket_id, name) values ('business-media', '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.webp') $$), 1::bigint, 'owner A adds a file to A');
reset role;

select * from finish();
rollback;
