-- Photo storage and its security (specs/media-storage.md).
-- Additive only (D-021). Rule 1: isolation by the database.
-- Bucket business-media: public read (approved, overview point 3), every write checked here.
-- Object names: <business_id>/<photo_id>/<width>.<webp|jpg>, widths 480, 960, 1440 (sizes made on the device).

-- ---------- Bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-media', 'business-media', true, 307200, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Helpers ----------
-- The business that owns an object name, or null when the name is not a valid photo name.
create or replace function app.media_business(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(480|960|1440)\.(webp|jpg)$'
    then split_part(object_name, '/', 1)::uuid
  end
$$;

-- A platform admin at aal2 with an open support session for this business (approved, overview point 2).
create or replace function app.has_open_support(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_platform_admin() and exists (
    select 1 from public.support_access s
    where s.business_id = bid and s.admin_id = (select auth.uid()) and s.ended_at is null
  )
$$;

-- Who may add or remove this business's photos.
create or replace function app.can_write_media(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select bid is not null and (app.has_permission(bid, 'content.edit') or app.has_open_support(bid))
$$;

-- Photo files this business already holds (security definer: counts every file, whoever reads).
create or replace function app.media_file_count(bid uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select count(*) from storage.objects o
  where o.bucket_id = 'business-media' and o.name like bid::text || '/%'
$$;

-- Safe limits, kept equal to packages/core photoLimits by a test.
create or replace function app.media_limits() returns jsonb
language sql immutable set search_path = '' as $$
  select '{"photos": 60, "files_per_photo": 3, "file_bytes": 307200, "widths": [480, 960, 1440]}'::jsonb
$$;

revoke all on function app.media_business(text), app.has_open_support(uuid), app.can_write_media(uuid),
  app.media_file_count(uuid), app.media_limits() from public;
grant execute on function app.media_business(text), app.has_open_support(uuid), app.can_write_media(uuid),
  app.media_file_count(uuid), app.media_limits() to authenticated;

-- ---------- Policies on storage.objects (this bucket only; no update: photos are never overwritten) ----------
create policy business_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-media'
    and app.can_write_media(app.media_business(name))
    and app.media_file_count(app.media_business(name))
      < ((app.media_limits() ->> 'photos')::int * (app.media_limits() ->> 'files_per_photo')::int)
  );

create policy business_media_select on storage.objects for select to authenticated
  using (
    bucket_id = 'business-media'
    and (app.is_member(app.media_business(name)) or app.is_platform_admin())
  );

create policy business_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'business-media' and app.can_write_media(app.media_business(name)));

-- ---------- media rows ----------
alter table public.media
  add column if not exists translations_checked jsonb not null default '{}'::jsonb
    check (jsonb_typeof(translations_checked) = 'object');
comment on column public.media.storage_path is 'Photo folder <business_id>/<photo_id>; the files are <width>.<webp|jpg> inside it.';

create or replace function app.check_media_row() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_path is not null
     and new.storage_path !~ ('^' || new.business_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
    raise exception 'a photo must be stored in its own business folder' using errcode = 'check_violation';
  end if;
  if new.bytes is not null and new.bytes > (app.media_limits() ->> 'file_bytes')::int * (app.media_limits() ->> 'files_per_photo')::int then
    raise exception 'photo is too large' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT'
     and (select count(*) from public.media m where m.business_id = new.business_id) >= (app.media_limits() ->> 'photos')::int then
    raise exception 'at most % photos per business', app.media_limits() ->> 'photos' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function app.check_media_row() from public;

create trigger media_check before insert or update of storage_path, bytes, business_id on public.media
  for each row execute function app.check_media_row();
