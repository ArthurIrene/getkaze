-- One controlled path to delete a business's change log (D-031 deletion at day 90;
-- data-deletion rights, COMPLIANCE.md §4). Additive only.
-- Normal use stays append-only: nobody can update or delete log rows directly.
-- Only a platform admin with aal2 (D-060) can call this; the deletion itself is
-- recorded in support_access, which this function never deletes.

-- The append-only guard now lets exactly one caller through: this function, which
-- runs as its owner and sets a transaction-local flag. A client cannot reach the
-- log at all (no delete privilege, no policy), so the flag alone opens nothing.
create or replace function app.no_change_log_edits() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE'
     and current_setting('app.change_log_delete', true) = 'on'
     and current_user = (select pg_get_userbyid(p.proowner) from pg_proc p
                         where p.oid = 'public.admin_delete_change_log(uuid, text)'::regprocedure) then
    return old;
  end if;
  raise exception 'content_changes is append-only' using errcode = 'insufficient_privilege';
end $$;

create or replace function public.admin_delete_change_log(p_business_id uuid, p_reason text)
returns bigint
language plpgsql volatile security definer set search_path = '' as $$
declare
  deleted bigint;
  reason text := btrim(coalesce(p_reason, ''));
begin
  if not app.is_platform_admin() then
    raise exception 'platform admin with two-factor login (aal2) required' using errcode = 'insufficient_privilege';
  end if;
  if char_length(reason) < 5 then
    raise exception 'a reason of at least 5 characters is required' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    raise exception 'unknown business' using errcode = 'no_data_found';
  end if;

  perform set_config('app.change_log_delete', 'on', true);
  delete from public.content_changes c where c.business_id = p_business_id;
  get diagnostics deleted = row_count;
  perform set_config('app.change_log_delete', 'off', true);

  insert into public.support_access (business_id, admin_id, reason, started_at, ended_at)
  values (
    p_business_id,
    (select auth.uid()),
    left(format('Change log deleted (%s rows): %s', deleted, reason), 200),
    now(),
    now()
  );
  return deleted;
end $$;

comment on function public.admin_delete_change_log(uuid, text) is
  'Platform admin (aal2) only: delete all change-log rows of one business, recorded in support_access.';

revoke all on function public.admin_delete_change_log(uuid, text) from public, anon;
grant execute on function public.admin_delete_change_log(uuid, text) to authenticated;
