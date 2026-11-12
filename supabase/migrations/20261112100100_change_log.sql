-- Change log and row guards (specs/core-data.md, D-011, D-024). Additive only.

-- A row can never move to another business.
create or replace function app.keep_business_id() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'business_id cannot change' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger site_settings_keep_business before update on public.site_settings
  for each row execute function app.keep_business_id();
create trigger business_modules_keep_business before update on public.business_modules
  for each row execute function app.keep_business_id();
create trigger memberships_keep_business before update on public.memberships
  for each row execute function app.keep_business_id();
create trigger catalog_items_keep_business before update on public.catalog_items
  for each row execute function app.keep_business_id();
create trigger media_keep_business before update on public.media
  for each row execute function app.keep_business_id();
create trigger support_access_keep_business before update on public.support_access
  for each row execute function app.keep_business_id();

-- Module switches record who and when.
create or replace function app.stamp_module_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.changed_at := now();
  new.changed_by := (select auth.uid());
  return new;
end $$;
create trigger business_modules_stamp before insert or update on public.business_modules
  for each row execute function app.stamp_module_change();

-- Who made a change: platform admin (with aal2), owner or staff of that business, or the system.
create or replace function app.actor_kind(bid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when (select auth.uid()) is null then 'system'
    when (select auth.jwt() ->> 'aal') = 'aal2'
      and exists (select 1 from public.platform_admins a where a.user_id = (select auth.uid())) then 'platform_admin'
    when exists (
      select 1 from public.memberships m
      where m.business_id = bid and m.user_id = (select auth.uid()) and 'owner' = any (m.roles)
    ) then 'owner'
    else 'staff'
  end
$$;

-- Append one change-log row per insert, update or delete: changed fields only for updates.
create or replace function app.log_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  new_row jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  old_row jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  row_data jsonb := coalesce(new_row, old_row);
  bid uuid := coalesce((row_data ->> 'business_id')::uuid, case when tg_table_name = 'businesses' then (row_data ->> 'id')::uuid end);
  diff jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(new_row) loop
      if k not in ('updated_at', 'changed_at') and (new_row -> k) is distinct from (old_row -> k) then
        diff := diff || jsonb_build_object(k, jsonb_build_object('from', old_row -> k, 'to', new_row -> k));
      end if;
    end loop;
    if diff = '{}'::jsonb then
      return new;
    end if;
  elsif tg_op = 'INSERT' then
    diff := new_row - 'updated_at' - 'created_at';
  else
    diff := old_row - 'updated_at' - 'created_at';
  end if;

  insert into public.content_changes (business_id, actor_id, actor_kind, table_name, row_id, action, changes)
  values (
    bid,
    (select auth.uid()),
    app.actor_kind(bid),
    tg_table_name,
    coalesce(row_data ->> 'id', concat_ws(':', row_data ->> 'business_id', row_data ->> 'module_id')),
    lower(tg_op),
    diff
  );
  return coalesce(new, old);
end $$;

create trigger businesses_log after insert or update or delete on public.businesses
  for each row execute function app.log_change();
create trigger site_settings_log after insert or update or delete on public.site_settings
  for each row execute function app.log_change();
create trigger business_modules_log after insert or update or delete on public.business_modules
  for each row execute function app.log_change();
create trigger memberships_log after insert or update or delete on public.memberships
  for each row execute function app.log_change();
create trigger catalog_items_log after insert or update or delete on public.catalog_items
  for each row execute function app.log_change();
create trigger media_log after insert or update or delete on public.media
  for each row execute function app.log_change();

-- The change log is append-only, for everyone (also database owners through the API).
create or replace function app.no_change_log_edits() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'content_changes is append-only' using errcode = 'insufficient_privilege';
end $$;
create trigger content_changes_append_only before update or delete on public.content_changes
  for each row execute function app.no_change_log_edits();
