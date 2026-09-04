alter table public.profiles add column if not exists email text;

update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where auth_user.id = profile.user_id
  and profile.email is distinct from auth_user.email;

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(user_id, full_name, phone_number, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.phone, new.raw_user_meta_data->>'phone_number'),
    new.email
  );
  insert into public.credit_wallets(user_id) values(new.id);
  insert into public.credit_transactions(user_id, transaction_type, credits, amount, description)
  values(new.id, 'credit', 100, 1000, 'Welcome credits');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
