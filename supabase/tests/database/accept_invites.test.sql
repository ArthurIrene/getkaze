-- accept_my_invites: only the caller's own invited rows, never disabled ones.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'invited@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'other@example.test');
insert into public.businesses (id, slug, name, preset, style) values
  ('00000000-0000-0000-0000-00000000000a', 'inv-a', 'A', 'hotel_lodge', 'lodge'),
  ('00000000-0000-0000-0000-00000000000b', 'inv-b', 'B', 'hotel_lodge', 'lodge');
insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'invited'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'disabled'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', array['owner'], 'invited');

set local role anon;
select throws_ok($$ select public.accept_my_invites() $$, '42501', null, 'anon cannot call it');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is(public.accept_my_invites(), 1, 'one invited membership becomes active');
reset role;

select is((select status from public.memberships where user_id = '00000000-0000-0000-0000-0000000000a1' and business_id = '00000000-0000-0000-0000-00000000000a'), 'active', 'the invited row is active');
select is((select status from public.memberships where user_id = '00000000-0000-0000-0000-0000000000a1' and business_id = '00000000-0000-0000-0000-00000000000b'), 'disabled', 'a disabled row stays disabled');
select is((select status from public.memberships where user_id = '00000000-0000-0000-0000-0000000000b1'), 'invited', 'another person''s invite is untouched');
select ok(exists (select 1 from public.content_changes where table_name = 'memberships' and action = 'update' and actor_id = '00000000-0000-0000-0000-0000000000a1'), 'the change is logged');

select * from finish();
rollback;
