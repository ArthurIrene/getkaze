-- When an invited person sets their first password, their own invited
-- memberships become active (specs/auth.md, specs/platform-admin.md).
-- Owners cannot write memberships, so this narrow function does only this:
-- it touches only the caller's rows, only from 'invited' to 'active'
-- (never 'disabled'). Additive only.
create or replace function public.accept_my_invites()
returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer;
begin
  if (select auth.uid()) is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege';
  end if;
  update public.memberships m
     set status = 'active'
   where m.user_id = (select auth.uid()) and m.status = 'invited';
  get diagnostics n = row_count;
  return n;
end $$;

comment on function public.accept_my_invites() is 'The caller''s own invited memberships become active (first password set).';
revoke all on function public.accept_my_invites() from public, anon;
grant execute on function public.accept_my_invites() to authenticated;
