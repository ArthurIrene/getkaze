-- Editor rules in the database (specs/editor-basics.md, editor-rooms-look.md).
-- Owners change only name, languages and default currency of their own business;
-- every other business column stays admin-only. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.test');
insert into public.businesses (id, slug, name, preset, style, status) values
  ('00000000-0000-0000-0000-00000000000a', 'biz-a', 'Lodge A', 'hotel_lodge', 'lodge', 'draft'),
  ('00000000-0000-0000-0000-00000000000b', 'biz-b', 'Lodge B', 'hotel_lodge', 'lodge', 'draft');
insert into public.site_settings (business_id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', array['owner'], 'active');
insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');

create schema tests;
grant usage on schema tests to authenticated;
create function tests.exec_count(sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute sql;
  get diagnostics n = row_count;
  return n;
exception when insufficient_privilege then return -1;
when others then return -2;
end $$;
grant execute on all functions in schema tests to authenticated;

-- ---------- Owner A ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.exec_count($$ update public.businesses set name = 'Lodge A2', languages = array['en', 'rw'], default_currency = 'usd' where id = '00000000-0000-0000-0000-00000000000a' $$),
  1::bigint, 'owner A changes name, languages and default currency');
select is(tests.exec_count(format($$ update public.businesses set %s where id = '00000000-0000-0000-0000-00000000000a' $$, change)), -1::bigint, 'owner A cannot change: ' || change)
from unnest(array[
  'status = ''active''', 'slug = ''biz-a-new''', 'custom_domain = ''a.example.test''', 'legal_name = ''A Ltd''',
  'preset = ''restaurant_bar'', style = ''bar_first''', 'style = ''guesthouse''', 'template = ''field-journal'', status = ''paused'''
]) change;
select is(tests.exec_count($$ update public.businesses set languages = array['rw'] where id = '00000000-0000-0000-0000-00000000000a' $$), -2::bigint, 'English stays required');
select is(tests.exec_count($$ update public.businesses set name = 'Taken' where id = '00000000-0000-0000-0000-00000000000b' $$), 0::bigint, 'owner A cannot change business B');
select is(tests.exec_count($$ update public.site_settings set translations_checked = '{"location.area": ["rw"]}' where business_id = '00000000-0000-0000-0000-00000000000a' $$), 1::bigint, 'owner A saves checked marks');
select is(tests.exec_count($$ update public.site_settings set contacts = '{}' where business_id = '00000000-0000-0000-0000-00000000000b' $$), 0::bigint, 'owner A cannot change B''s settings');

-- ---------- Admin ----------
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.exec_count($$ update public.businesses set slug = 'biz-a-x' where id = '00000000-0000-0000-0000-00000000000a' $$), 0::bigint, 'admin at aal1 changes nothing');
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
select is(tests.exec_count($$ update public.businesses set slug = 'biz-a-x', legal_name = 'A Ltd' where id = '00000000-0000-0000-0000-00000000000a' $$), 1::bigint, 'admin at aal2 changes the other columns');
reset role;

select is((select name || ' ' || array_to_string(languages, ',') || ' ' || default_currency || ' ' || slug from public.businesses where id = '00000000-0000-0000-0000-00000000000a'),
  'Lodge A2 en,rw usd biz-a-x', 'the allowed changes were saved');

-- ---------- Feature 3: rooms, sections, look (editor-rooms-look.md) ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select lives_ok($$ insert into public.catalog_items (id, business_id, kind, handle, name, price_rwf, price_usd, max_guests, units, translations_checked)
  values ('00000000-0000-0000-0000-0000000001a1', '00000000-0000-0000-0000-00000000000a', 'room_type', 'garden', '{"en": "Garden", "rw": "Ubusitani"}', 120000, 90, 2, 3, '{"name": ["rw"]}') $$, 'owner A adds a room to A');
select throws_ok($$ insert into public.catalog_items (business_id, kind, name, price_rwf, max_guests) values ('00000000-0000-0000-0000-00000000000a', 'room_type', '{"en": "Half"}', 1000, 2) $$,
  '23514', null, 'a room needs both prices (D-023)');
select throws_ok($$ insert into public.catalog_items (business_id, kind, name, price_rwf, price_usd, max_guests) values ('00000000-0000-0000-0000-00000000000b', 'room_type', '{"en": "Sneaky"}', 1, 1, 1) $$,
  '42501', null, 'owner A cannot add a room to B');
select is(tests.exec_count($$ update public.catalog_items set position = 5 where id = '00000000-0000-0000-0000-0000000001a1' $$), 1::bigint, 'owner A reorders A''s room');
select is(tests.exec_count($$ update public.site_settings set look = '{"color_set": "night", "accent": "clay"}', sections = '[{"id": "rooms", "visible": true}]' where business_id = '00000000-0000-0000-0000-00000000000a' $$), 1::bigint, 'owner A saves look and sections');
select is(tests.exec_count(format($$ update public.site_settings set look = %L where business_id = '00000000-0000-0000-0000-00000000000a' $$, bad)), -2::bigint, 'a bad look is refused: ' || bad)
from unnest(array['{"accent": "pink"}', '{"color_set": "dusk"}', '{"font": "comic"}', '[]']) bad;
select is(tests.exec_count($$ delete from public.catalog_items where id = '00000000-0000-0000-0000-0000000001a1' $$), 1::bigint, 'owner A deletes A''s room');
reset role;
insert into public.catalog_items (id, business_id, kind, name, price_rwf, price_usd, max_guests) values
  ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-00000000000b', 'room_type', '{"en": "Room B"}', 1, 1, 1);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.exec_count($$ update public.catalog_items set price_rwf = 1 where id = '00000000-0000-0000-0000-0000000001b1' $$), 0::bigint, 'owner A cannot change B''s room');
select is(tests.exec_count($$ delete from public.catalog_items where id = '00000000-0000-0000-0000-0000000001b1' $$), 0::bigint, 'owner A cannot delete B''s room');
reset role;

select * from finish();
rollback;
