create table if not exists public.blocked_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  blocked_by uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

alter table public.blocked_users enable row level security;

drop policy if exists "blocked_users_select_self" on public.blocked_users;
create policy "blocked_users_select_self" on public.blocked_users for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "blocked_users_admin_select" on public.blocked_users;
create policy "blocked_users_admin_select" on public.blocked_users for select to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

revoke all on public.blocked_users from anon, authenticated;
grant select on public.blocked_users to authenticated;

create or replace function public.set_user_blocked(
  p_user_id uuid,
  p_blocked boolean,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_admin uuid := auth.uid();
begin
  if v_admin is null or not exists (
    select 1 from public.admin_users where user_id = v_admin
  ) then
    raise exception 'Administrator access required';
  end if;
  if p_user_id = v_admin then raise exception 'You cannot block your own account'; end if;
  if exists (select 1 from public.admin_users where user_id = p_user_id) then
    raise exception 'Administrator accounts cannot be blocked';
  end if;

  if p_blocked then
    insert into public.blocked_users(user_id, blocked_by, note)
    values (p_user_id, v_admin, nullif(btrim(p_note), ''))
    on conflict (user_id) do update
    set blocked_by = excluded.blocked_by, note = excluded.note, created_at = now();
  else
    delete from public.blocked_users where user_id = p_user_id;
  end if;
end;
$$;

revoke all on function public.set_user_blocked(uuid, boolean, text) from public, anon;
grant execute on function public.set_user_blocked(uuid, boolean, text) to authenticated;

notify pgrst, 'reload schema';
