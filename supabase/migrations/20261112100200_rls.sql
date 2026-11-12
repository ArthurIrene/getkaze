-- Row-level security on every table (specs/row-level-security.md).
-- Rule 1: isolation is enforced by the database. D-060: admin rights need aal2.
-- anon gets no table access at all; guests read through public.get_published_site only.

-- ---------- Helpers (private schema app; security definer so they can read memberships) ----------
create or replace function app.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
    and exists (select 1 from public.platform_admins a where a.user_id = (select auth.uid()))
$$;

create or replace function app.is_member(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.business_id = bid and m.user_id = (select auth.uid()) and m.status = 'active'
  )
$$;

create or replace function app.has_permission(bid uuid, perm text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.businesses b on b.id = m.business_id
    join public.role_permissions rp on rp.preset = b.preset and rp.role = any (m.roles)
    where m.business_id = bid
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and rp.permission = perm
  )
$$;

revoke all on all functions in schema app from public;
grant usage on schema app to authenticated;
grant execute on function app.is_platform_admin(), app.is_member(uuid), app.has_permission(uuid, text) to authenticated;
-- Check constraints call these as the writing user.
grant execute on function app.is_localized(jsonb), app.is_localized_or_null(jsonb) to authenticated;

-- ---------- Least privilege: start from nothing ----------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
-- Tables created later get no automatic grants either (the meta test checks anon).
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- ---------- Enable and force RLS on every table ----------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------- businesses ----------
grant select, insert, update on public.businesses to authenticated;
create policy businesses_select on public.businesses for select to authenticated
  using (app.is_member(id) or app.is_platform_admin());
create policy businesses_insert on public.businesses for insert to authenticated
  with check (app.is_platform_admin());
create policy businesses_update on public.businesses for update to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------- site_settings ----------
grant select, insert, update on public.site_settings to authenticated;
create policy site_settings_select on public.site_settings for select to authenticated
  using (app.is_member(business_id) or app.is_platform_admin());
create policy site_settings_insert on public.site_settings for insert to authenticated
  with check (app.is_platform_admin());
create policy site_settings_update on public.site_settings for update to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin())
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());

-- ---------- catalog_items and media ----------
grant select, insert, update, delete on public.catalog_items, public.media to authenticated;
create policy catalog_items_select on public.catalog_items for select to authenticated
  using (app.is_member(business_id) or app.is_platform_admin());
create policy catalog_items_insert on public.catalog_items for insert to authenticated
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());
create policy catalog_items_update on public.catalog_items for update to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin())
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());
create policy catalog_items_delete on public.catalog_items for delete to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());

create policy media_select on public.media for select to authenticated
  using (app.is_member(business_id) or app.is_platform_admin());
create policy media_insert on public.media for insert to authenticated
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());
create policy media_update on public.media for update to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin())
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());
create policy media_delete on public.media for delete to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());

-- ---------- business_modules (switches are ours, D-017) ----------
grant select, insert, update on public.business_modules to authenticated;
create policy business_modules_select on public.business_modules for select to authenticated
  using (app.is_member(business_id) or app.is_platform_admin());
create policy business_modules_insert on public.business_modules for insert to authenticated
  with check (app.is_platform_admin());
create policy business_modules_update on public.business_modules for update to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------- modules, role_permissions, reserved_slugs (platform lists, read only) ----------
grant select on public.modules, public.role_permissions, public.reserved_slugs to authenticated;
create policy modules_select on public.modules for select to authenticated using (true);
create policy role_permissions_select on public.role_permissions for select to authenticated using (true);
create policy reserved_slugs_select on public.reserved_slugs for select to authenticated using (true);

-- ---------- memberships (invite only: written by admins) ----------
grant select, insert, update on public.memberships to authenticated;
create policy memberships_select on public.memberships for select to authenticated
  using (
    (user_id = (select auth.uid()) and status <> 'disabled')
    or app.has_permission(business_id, 'members.view')
    or app.is_platform_admin()
  );
create policy memberships_insert on public.memberships for insert to authenticated
  with check (app.is_platform_admin());
create policy memberships_update on public.memberships for update to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- ---------- platform_admins (SQL only; a user can see their own row) ----------
grant select on public.platform_admins to authenticated;
create policy platform_admins_select_own on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------- click_events (read now; written from Batch 3) ----------
grant select on public.click_events to authenticated;
create policy click_events_select on public.click_events for select to authenticated
  using (app.has_permission(business_id, 'stats.view') or app.is_platform_admin());

-- ---------- content_changes (triggers write; read by owners and admins) ----------
grant select on public.content_changes to authenticated;
create policy content_changes_select on public.content_changes for select to authenticated
  using (app.has_permission(business_id, 'changes.view') or app.is_platform_admin());

-- ---------- support_access (admins open and close; owners see it) ----------
grant select, insert on public.support_access to authenticated;
grant update (ended_at) on public.support_access to authenticated;
create policy support_access_select on public.support_access for select to authenticated
  using (app.has_permission(business_id, 'changes.view') or app.is_platform_admin());
create policy support_access_insert on public.support_access for insert to authenticated
  with check (app.is_platform_admin() and admin_id = (select auth.uid()) and ended_at is null);
create policy support_access_update on public.support_access for update to authenticated
  using (app.is_platform_admin() and admin_id = (select auth.uid()))
  with check (app.is_platform_admin() and admin_id = (select auth.uid()));
