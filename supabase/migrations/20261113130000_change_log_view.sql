-- Change log view (specs/change-log-view.md). Additive only (D-021).
-- Owners read their own business's log; platform admins (aal2) read every log,
-- and each admin read of a business's log is recorded in support_access, which
-- the owner sees (approved point 10, ROLES.md §5).

-- ---------- support_access: what kind of access ----------
alter table public.support_access
  add column if not exists kind text not null default 'session' check (kind in ('session', 'log_read'));
comment on column public.support_access.kind is 'session: an admin support session (opened and closed); log_read: an admin read this business''s change log.';

-- ---------- The log, as the screens show it ----------
-- One row per change (field names only, never values) or support event, newest first.
-- Private: called only by public.get_change_log after its access check.
create or replace function app.change_log_page(p_business uuid, p_admin boolean, p_offset integer, p_limit integer)
returns table (
  id text, business_id uuid, business_name text, at timestamptz, kind text,
  actor text, actor_email text, table_name text, row_id text, action text, fields text[], label text, reason text
)
language sql stable security definer set search_path = '' as $$
  with events as (
    select 'c' || c.id::text as id, c.business_id, c.at, 'change'::text as kind,
      case
        when c.actor_id = (select auth.uid()) then 'you'
        when c.actor_kind = 'platform_admin' then 'support'
        else c.actor_kind
      end as actor,
      c.actor_id, c.table_name, c.row_id, c.action,
      case when c.action = 'update' then array(select jsonb_object_keys(c.changes) order by 1) else '{}'::text[] end as fields,
      coalesce(
        c.changes -> 'name' ->> 'en',
        c.changes -> 'name' -> 'to' ->> 'en',
        (select i.name ->> 'en' from public.catalog_items i where i.id::text = c.row_id),
        case when jsonb_typeof(c.changes -> 'place') = 'string' then c.changes ->> 'place' end,
        (select m.place from public.media m where m.id::text = c.row_id)
      ) as label,
      null::text as reason
    from public.content_changes c
    where p_business is null or c.business_id = p_business
    union all
    select 's' || s.id::text || ':start', s.business_id, s.started_at,
      case when s.kind = 'log_read' then 'log_read' else 'support_start' end,
      'support', s.admin_id, null, null, null, '{}'::text[], null, s.reason
    from public.support_access s
    where p_business is null or s.business_id = p_business
    union all
    select 's' || s.id::text || ':end', s.business_id, s.ended_at, 'support_end',
      'support', s.admin_id, null, null, null, '{}'::text[], null, s.reason
    from public.support_access s
    where s.ended_at is not null and s.kind = 'session' and (p_business is null or s.business_id = p_business)
  )
  select e.id, e.business_id, b.name, e.at, e.kind, e.actor,
    case when p_admin then u.email::text end,
    e.table_name, e.row_id, e.action, e.fields, e.label, e.reason
  from events e
  join public.businesses b on b.id = e.business_id
  left join auth.users u on u.id = e.actor_id
  order by e.at desc, e.id desc
  offset greatest(coalesce(p_offset, 0), 0) limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;
revoke all on function app.change_log_page(uuid, boolean, integer, integer) from public, anon, authenticated;

-- Owners: their own business (changes.view). Admins (aal2): any business, or all (p_business null).
-- p_business null = every business (admins only). The actor's email only for admins.
create or replace function public.get_change_log(p_business uuid default null, p_offset integer default 0, p_limit integer default 50)
returns table (
  id text, business_id uuid, business_name text, at timestamptz, kind text,
  actor text, actor_email text, table_name text, row_id text, action text, fields text[], label text, reason text
)
language plpgsql volatile security definer set search_path = '' as $$
declare
  admin boolean := app.is_platform_admin();
begin
  if p_business is null and not admin then
    return;
  end if;
  if p_business is not null and not (app.has_permission(p_business, 'changes.view') or admin) then
    return;
  end if;

  -- An admin read of businesses the admin is not a member of is recorded (support_access, visible to
  -- the owner): each business shown on this page, at most once per 10 minutes per admin.
  if admin then
    insert into public.support_access (business_id, admin_id, reason, started_at, ended_at, kind)
    select t.bid, (select auth.uid()), 'Read the change log', now(), now(), 'log_read'
    from (
      select p_business as bid where p_business is not null
      union
      select distinct r.business_id from app.change_log_page(p_business, true, p_offset, p_limit) r where p_business is null
    ) t
    where not app.has_permission(t.bid, 'changes.view')
      and not exists (
        select 1 from public.support_access s
        where s.business_id = t.bid and s.admin_id = (select auth.uid()) and s.kind = 'log_read'
          and s.started_at > now() - interval '10 minutes'
      );
  end if;

  return query select * from app.change_log_page(p_business, admin, p_offset, p_limit);
end $$;

revoke all on function public.get_change_log(uuid, integer, integer) from public, anon;
grant execute on function public.get_change_log(uuid, integer, integer) to authenticated;
comment on function public.get_change_log(uuid, integer, integer) is
  'Change log screens: owners their business, platform admins (aal2) all; admin reads are recorded in support_access.';
