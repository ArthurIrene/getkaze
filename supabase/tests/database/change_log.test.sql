-- Change log: append-only in normal use; one controlled deletion path (admin, aal2),
-- itself recorded in support_access. Runs with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.test');
insert into public.businesses (id, slug, name, preset, style) values
  ('00000000-0000-0000-0000-00000000000a', 'log-a', 'Log A', 'hotel_lodge', 'lodge'),
  ('00000000-0000-0000-0000-00000000000b', 'log-b', 'Log B', 'hotel_lodge', 'lodge');
insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active');
insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');
update public.businesses set name = name || ' (edited)';  -- more log rows for both

select ok((select count(*) from public.content_changes where business_id = '00000000-0000-0000-0000-00000000000a') >= 2, 'business A has change-log rows');
create temp table b_rows_before on commit drop as
  select count(*) as n from public.content_changes where business_id = '00000000-0000-0000-0000-00000000000b';
grant select on b_rows_before to authenticated, service_role;

-- ---------- Normal roles cannot edit or delete log rows ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select throws_ok($$ delete from public.content_changes $$, '42501', null, 'owner cannot delete log rows');
select throws_ok($$ update public.content_changes set action = 'insert' $$, '42501', null, 'owner cannot edit log rows');
select throws_ok($$ select set_config('app.change_log_delete', 'on', true); delete from public.content_changes $$, '42501', null, 'setting the flag does not let an owner delete');
select throws_ok($$ select public.admin_delete_change_log('00000000-0000-0000-0000-00000000000a', 'Owner trying') $$, '42501', null, 'owner cannot call the deletion path');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal1"}', true);
select throws_ok($$ select public.admin_delete_change_log('00000000-0000-0000-0000-00000000000a', 'No second factor') $$, '42501', null, 'admin without aal2 cannot delete the log');

reset role;
set local role anon;
select throws_ok($$ select public.admin_delete_change_log('00000000-0000-0000-0000-00000000000a', 'Anonymous try') $$, '42501', null, 'anon cannot call the deletion path');

-- Even the service role and the database owner cannot delete or edit rows directly.
reset role;
set local role service_role;
select throws_ok($$ delete from public.content_changes $$, '42501', null, 'service role cannot delete log rows directly');
select throws_ok($$ select set_config('app.change_log_delete', 'on', true); delete from public.content_changes $$, '42501', null, 'service role with the flag still cannot delete directly');
reset role;
select throws_ok($$ update public.content_changes set action = 'insert' $$, '42501', null, 'the database owner cannot edit log rows');

-- ---------- The controlled path: admin with aal2 ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
select throws_ok($$ select public.admin_delete_change_log('00000000-0000-0000-0000-00000000000a', 'no') $$, '23514', null, 'a reason is required');
select throws_ok($$ select public.admin_delete_change_log('00000000-0000-0000-0000-0000000000ff', 'Unknown business') $$, 'P0002', null, 'an unknown business is refused');
select cmp_ok(public.admin_delete_change_log('00000000-0000-0000-0000-00000000000a', 'D-031 day 90 deletion'), '>=', 2::bigint, 'admin with aal2 deletes A''s log rows and gets the count');

reset role;
select is((select count(*) from public.content_changes where business_id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'no log rows of A remain');
select is((select count(*) from public.content_changes where business_id = '00000000-0000-0000-0000-00000000000b'), (select n from b_rows_before), 'B''s log is untouched');
select ok(exists (
  select 1 from public.support_access
  where business_id = '00000000-0000-0000-0000-00000000000a'
    and admin_id = '00000000-0000-0000-0000-0000000000ad'
    and reason like 'Change log deleted (% rows): D-031 day 90 deletion'
    and ended_at is not null
), 'the deletion is recorded in the support-access log');
select throws_ok($$ delete from public.content_changes where business_id = '00000000-0000-0000-0000-00000000000b' $$, '42501', null, 'after the call, direct deletes are blocked again');

-- New changes are logged again after a deletion.
update public.businesses set name = 'Log A again' where id = '00000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.content_changes where business_id = '00000000-0000-0000-0000-00000000000a'), 1::bigint, 'logging continues after the deletion');

select * from finish();
rollback;
