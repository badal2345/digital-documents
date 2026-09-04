create or replace function public.list_app_users()
returns table (
  user_id uuid,
  full_name text,
  email text,
  phone_number text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users where admin_users.user_id = auth.uid()
  ) then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    auth_user.id,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
      'User'
    ),
    auth_user.email::text,
    coalesce(auth_user.phone, auth_user.raw_user_meta_data->>'phone_number')::text,
    auth_user.created_at
  from auth.users as auth_user
  order by auth_user.created_at desc;
end;
$$;

revoke all on function public.list_app_users() from public, anon;
grant execute on function public.list_app_users() to authenticated;
