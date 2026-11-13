-- Isolation test, storage part (specs/media-storage.md). Runs with `supabase test db`.
-- Business A can never add, list or remove business B's photo files; names must be
-- <business_id>/<photo_id>/<480|960|1440>.<webp|jpg>; at most 60 photos (180 files);
-- admins need aal2 and an open support session. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- ---------- Fixtures (as postgres) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@example.test'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.test'),
  ('00000000-0000-0000-0000-0000000000d1', 'disabled@example.test');
insert into public.businesses (id, slug, name, preset, style, status) values
  ('00000000-0000-0000-0000-00000000000a', 'biz-a', 'Lodge A', 'hotel_lodge', 'lodge', 'active'),
  ('00000000-0000-0000-0000-00000000000b', 'biz-b', 'Lodge B', 'hotel_lodge', 'lodge', 'active'),
  ('00000000-0000-0000-0000-00000000000c', 'biz-c', 'Lodge C', 'hotel_lodge', 'lodge', 'draft');
insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', array['owner'], 'active'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', array['owner'], 'disabled');
insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');
insert into public.support_access (business_id, admin_id, reason) values
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000ad', 'Adding the hero photo');
-- One file of B, made as postgres.
insert into storage.objects (bucket_id, name) values
  ('business-media', '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f1/960.webp');

create schema tests;
grant usage on schema tests to authenticated, anon;
-- Rows a statement touched; -1 when refused by a policy or privilege, -2 for any other error.
create function tests.exec_count(sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute sql;
  get diagnostics n = row_count;
  return n;
exception when insufficient_privilege then return -1;
when others then return -2;
end $$;
create function tests.put(object_name text) returns bigint language sql as $$
  select tests.exec_count(format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'business-media', object_name))
$$;
create function tests.files(prefix text) returns bigint language sql as $$
  select count(*) from storage.objects where bucket_id = 'business-media' and name like prefix || '%'
$$;
grant execute on all functions in schema tests to authenticated, anon;

-- Storage blocks direct SQL deletes unless this is set (the Storage API sets it); policies still apply.
select set_config('storage.allow_delete_query', 'true', true);

-- ---------- Bucket and limits ----------
select is((select public from storage.buckets where id = 'business-media'), true, 'bucket is public for reading');
select is((select file_size_limit from storage.buckets where id = 'business-media'), 307200::bigint, 'files are at most 300 KB');
select is((select allowed_mime_types from storage.buckets where id = 'business-media'), array['image/webp', 'image/jpeg'], 'only WebP and JPEG');
select is(app.media_business('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.webp'), '00000000-0000-0000-0000-00000000000a'::uuid, 'a valid name gives its business');
select is(app.media_business(n), null, 'invalid name: ' || n) from unnest(array[
  '00000000-0000-0000-0000-00000000000a/x.webp',
  '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/500.webp',
  '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.png',
  '00000000-0000-0000-0000-00000000000a/../00000000-0000-0000-0000-00000000000b/480.webp',
  '00000000-0000-0000-0000-00000000000A/00000000-0000-0000-0000-0000000000f2/480.webp',
  'x/00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.webp'
]) n;

-- ---------- Owner A ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.put('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.webp'), 1::bigint, 'owner A adds a file to A');
select is(tests.put('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/1440.jpg'), 1::bigint, 'owner A adds a JPEG to A');
select is(tests.put('00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f3/480.webp'), -1::bigint, 'owner A cannot add to B');
select is(tests.put('00000000-0000-0000-0000-00000000000a/photo.webp'), -1::bigint, 'owner A cannot use a free name');
select is(tests.put('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.svg'), -1::bigint, 'owner A cannot add an SVG name');
select is(tests.exec_count($$ insert into storage.objects (bucket_id, name) values ('other', '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/480.webp') $$), -1::bigint, 'owner A cannot write another bucket');
select is(tests.files('00000000-0000-0000-0000-00000000000a/'), 2::bigint, 'owner A lists A''s files');
select is(tests.files('00000000-0000-0000-0000-00000000000b/'), 0::bigint, 'owner A lists nothing of B');
select is(tests.exec_count($$ delete from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%' $$), 0::bigint, 'owner A deletes nothing of B');
select is(tests.exec_count($$ update storage.objects set name = name where bucket_id = 'business-media' $$), 0::bigint, 'no one overwrites a file (no update policy)');
select is(tests.exec_count($$ delete from storage.objects where name = '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2/1440.jpg' $$), 1::bigint, 'owner A deletes A''s file');

-- Photo rows point into their own folder only.
select throws_ok($$ insert into public.media (business_id, place, alt, storage_path) values ('00000000-0000-0000-0000-00000000000a', 'gallery', '{"en": "x"}', '00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f1') $$,
  '23514', null, 'a photo of A cannot point to B''s folder');
select lives_ok($$ insert into public.media (business_id, place, alt, storage_path, bytes) values ('00000000-0000-0000-0000-00000000000a', 'gallery', '{"en": "Terrace"}', '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f2', 200000) $$,
  'a photo of A in A''s folder');
select throws_ok($$ insert into public.media (business_id, place, alt, storage_path, bytes) values ('00000000-0000-0000-0000-00000000000a', 'gallery', '{"en": "Big"}', '00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f4', 1000000) $$,
  '23514', null, 'a photo over 3 × 300 KB is refused');

-- ---------- Owner B, disabled member, anon ----------
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.files('00000000-0000-0000-0000-00000000000a/'), 0::bigint, 'owner B lists nothing of A');
select is(tests.files('00000000-0000-0000-0000-00000000000b/'), 1::bigint, 'owner B lists B''s file');
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.put('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f5/480.webp'), -1::bigint, 'a disabled member cannot add');
select is(tests.files('00000000-0000-0000-0000-00000000000a/'), 0::bigint, 'a disabled member lists nothing');
reset role;
set local role anon;
select is(tests.put('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f5/480.webp'), -1::bigint, 'anon cannot add');
select is(tests.exec_count($$ delete from storage.objects where bucket_id = 'business-media' $$), 0::bigint, 'anon deletes nothing');
reset role;

-- ---------- Platform admin ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.put('00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f6/480.webp'), -1::bigint, 'admin at aal1 cannot add');
select is(tests.files('00000000-0000-0000-0000-00000000000b/'), 0::bigint, 'admin at aal1 lists nothing');
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000ad", "role": "authenticated", "aal": "aal2"}', true);
select is(tests.put('00000000-0000-0000-0000-00000000000c/00000000-0000-0000-0000-0000000000f6/480.webp'), -1::bigint, 'admin at aal2 without a support session cannot add');
select is(tests.put('00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f6/480.webp'), 1::bigint, 'admin at aal2 with an open support session adds');
select is(tests.files('00000000-0000-0000-0000-00000000000a/'), 1::bigint, 'admin at aal2 lists every business');
select is(tests.exec_count($$ delete from storage.objects where name like '00000000-0000-0000-0000-00000000000a/%' $$), 0::bigint, 'admin without a session for A deletes nothing of A');
select is(tests.exec_count($$ delete from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%' $$), 2::bigint, 'admin with a session for B removes B''s whole folder');
-- Once the session ends, writes stop.
update public.support_access set ended_at = now() where business_id = '00000000-0000-0000-0000-00000000000b';
select is(tests.put('00000000-0000-0000-0000-00000000000b/00000000-0000-0000-0000-0000000000f7/480.webp'), -1::bigint, 'admin after the session ended cannot add');
reset role;

-- ---------- Count limit: 60 photos (180 files, 60 rows) ----------
insert into storage.objects (bucket_id, name)
select 'business-media', format('00000000-0000-0000-0000-00000000000a/%s/480.webp', gen_random_uuid())
from generate_series(1, 180 - tests.files('00000000-0000-0000-0000-00000000000a/'));
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "aal": "aal1"}', true);
select is(tests.put('00000000-0000-0000-0000-00000000000a/00000000-0000-0000-0000-0000000000f8/480.webp'), -1::bigint, 'the 181st file is refused');
reset role;
insert into public.media (business_id, place, alt)
select '00000000-0000-0000-0000-00000000000a', 'gallery', '{"en": "x"}'
from generate_series(1, 60 - (select count(*) from public.media where business_id = '00000000-0000-0000-0000-00000000000a'));
select throws_ok($$ insert into public.media (business_id, place, alt) values ('00000000-0000-0000-0000-00000000000a', 'gallery', '{"en": "61st"}') $$,
  '23514', null, 'the 61st photo is refused');

select * from finish();
rollback;
