-- Change log view (specs/change-log-view.md): owners read only their own log and
-- never an email; admins need aal2, see every log with emails, and each admin
-- read of a business's log is recorded for its owner. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.test');
insert into public.businesses (id, slug, name, preset, style) values
  ('00000000-0000-0000-0000-00000000000a', 'biz-a', 'Lodge A', 'hotel_lodge', 'lodge'),
  ('00000000-0000-0000-0000-00000000000b', 'biz-b', 'Lodge B', 'hotel_lodge', 'lodge');
insert into public.site_settings (business_id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', array['owner'], 'active');
insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');

-- Owner A changes a room price; the admin edits A during a support session.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
insert into public.catalog_items (id, business_id, kind, name, price_rwf, price_usd, max_guests)
  values ('00000000-0000-0000-0000-0000000001a1', '00000000-0000-0000-0000-00000000000a', 'room_type', '{"en": "Garden room"}', 60000, 45, 2);
update public.catalog_items set price_rwf = 65000, price_usd = 48 where id = '00000000-0000-0000-0000-0000000001a1';
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
insert into public.support_access (business_id, admin_id, reason) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ad', 'Fixing the hero text');
update public.site_settings set hero = '{"title": {"en": "Welcome"}}' where business_id = '00000000-0000-0000-0000-00000000000a';
update public.support_access set ended_at = now() where business_id = '00000000-0000-0000-0000-00000000000a';
reset role;
update public.site_settings set hero = '{"title": {"en": "Hello B"}}' where business_id = '00000000-0000-0000-0000-00000000000b';

-- ---------- Owner A ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
create temp table a_log on commit drop as select * from public.get_change_log('00000000-0000-0000-0000-00000000000a');
select ok((select count(*) from a_log) >= 4, 'owner A reads A''s log');
select is((select count(*) from a_log where business_id <> '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'only A''s rows');
select is((select count(*) from a_log where actor_email is not null), 0::bigint, 'owners never see an email');
select is((select fields from a_log where table_name = 'catalog_items' and action = 'update'), array['price_rwf', 'price_usd'], 'a price change names its fields, not values');
select is((select actor from a_log where table_name = 'catalog_items' and action = 'update'), 'you', 'the owner''s own change says "you"');
select is((select label from a_log where table_name = 'catalog_items' and action = 'update'), 'Garden room', 'the room is named');
select is((select actor from a_log where table_name = 'site_settings' and action = 'update'), 'support', 'the admin''s change says "support"');
select ok(exists (select 1 from a_log where kind = 'support_start' and reason = 'Fixing the hero text') and exists (select 1 from a_log where kind = 'support_end'), 'the support visit shows its start and end');
select is((select count(*) from public.get_change_log('00000000-0000-0000-0000-00000000000b')), 0::bigint, 'owner A reads nothing of B');
select is((select count(*) from public.get_change_log(null)), 0::bigint, 'an owner cannot read every log');
select is((select count(*) from public.support_access where kind = 'log_read'), 0::bigint, 'owner reads are not support access');
select throws_ok($$ select * from app.change_log_page(null, true, 0, 50) $$, '42501', null, 'the private page function is not callable');

-- ---------- Admin ----------
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal1"}', true);
select is((select count(*) from public.get_change_log(null)), 0::bigint, 'admin at aal1 reads nothing');
select is((select count(*) from public.get_change_log('00000000-0000-0000-0000-00000000000a')), 0::bigint, 'admin at aal1 reads nothing of A');
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
create temp table all_log on commit drop as select * from public.get_change_log(null);
select ok((select count(distinct business_id) from all_log where business_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')) = 2, 'admin at aal2 reads every business (A and B among them)');
select is((select actor_email from all_log where business_id = '00000000-0000-0000-0000-00000000000a' and table_name = 'catalog_items' and action = 'update'), 'owner-a@example.test', 'admins see the actor''s email');
reset role;
select is((select count(*) from public.support_access where kind = 'log_read' and business_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')), 2::bigint, 'the admin read is recorded once per business shown (A and B)');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
select count(*) from public.get_change_log('00000000-0000-0000-0000-00000000000a');
reset role;
select is((select count(*) from public.support_access where kind = 'log_read' and business_id = '00000000-0000-0000-0000-00000000000a'), 1::bigint, 'a second read of A within 10 minutes is not recorded again');

-- ---------- Owner A sees the admin's read ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is((select count(*) from public.get_change_log('00000000-0000-0000-0000-00000000000a') where kind = 'log_read'), 1::bigint, 'owner A sees that support read the log');
reset role;

select * from finish();
rollback;
