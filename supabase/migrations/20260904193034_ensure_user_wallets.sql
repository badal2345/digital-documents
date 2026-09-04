-- Create missing wallets for existing Auth users and record the welcome credit once.
with inserted_wallets as (
  insert into public.credit_wallets (user_id)
  select auth_user.id
  from auth.users as auth_user
  on conflict (user_id) do nothing
  returning user_id, total_amount, total_credits
)
insert into public.credit_transactions (
  user_id,
  transaction_type,
  credits,
  amount,
  description
)
select
  user_id,
  'credit',
  total_credits,
  total_amount,
  'Welcome credits'
from inserted_wallets;

-- This trigger is independent of the frontend and runs for every future Auth signup.
create or replace function public.ensure_new_user_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_amount numeric(12,2);
  v_total_credits integer;
begin
  -- Some existing installations have profiles and some do not.
  if to_regclass('public.profiles') is not null then
    execute $profile$
      insert into public.profiles (user_id, full_name, phone_number)
      values ($1, $2, $3)
      on conflict (user_id) do nothing
    $profile$
    using
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'User'),
      coalesce(new.phone, new.raw_user_meta_data->>'phone_number');
  end if;

  insert into public.credit_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing
  returning total_amount, total_credits into v_total_amount, v_total_credits;

  if found then
    insert into public.credit_transactions (
      user_id,
      transaction_type,
      credits,
      amount,
      description
    ) values (
      new.id,
      'credit',
      v_total_credits,
      v_total_amount,
      'Welcome credits'
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.ensure_new_user_account() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists ensure_new_user_account on auth.users;
create trigger ensure_new_user_account
after insert on auth.users
for each row execute function public.ensure_new_user_account();

notify pgrst, 'reload schema';
