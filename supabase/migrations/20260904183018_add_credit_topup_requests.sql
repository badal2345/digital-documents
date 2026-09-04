create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.credit_topup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id text not null check (char_length(btrim(transaction_id)) between 4 and 100),
  amount numeric(12,2) not null check (amount in (20, 100, 500, 1000, 3000)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index credit_topup_transaction_id_idx
on public.credit_topup_requests (lower(transaction_id));
create index credit_topup_user_created_idx
on public.credit_topup_requests (user_id, created_at desc);
create index credit_topup_pending_created_idx
on public.credit_topup_requests (created_at)
where status = 'pending';

alter table public.admin_users enable row level security;
alter table public.credit_topup_requests enable row level security;

create policy "admin_users_select_self" on public.admin_users for select to authenticated
using ((select auth.uid()) = user_id);
create policy "topups_insert_own" on public.credit_topup_requests for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "topups_select_own" on public.credit_topup_requests for select to authenticated
using ((select auth.uid()) = user_id);
create policy "topups_admin_select" on public.credit_topup_requests for select to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

revoke all on public.admin_users, public.credit_topup_requests from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select, insert on public.credit_topup_requests to authenticated;

create or replace function public.review_credit_topup(
  p_request_id uuid,
  p_approve boolean,
  p_admin_note text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  v_request public.credit_topup_requests%rowtype;
  v_credits integer;
begin
  if v_admin is null or not exists (
    select 1 from public.admin_users where user_id = v_admin
  ) then
    raise exception 'Administrator access required';
  end if;

  select * into v_request
  from public.credit_topup_requests
  where id = p_request_id
  for update;

  if not found then raise exception 'Top-up request not found'; end if;
  if v_request.status <> 'pending' then raise exception 'Top-up request has already been reviewed'; end if;

  if p_approve then
    update public.credit_wallets
    set total_amount = total_amount + v_request.amount, updated_at = now()
    where user_id = v_request.user_id;
    if not found then raise exception 'User wallet not found'; end if;

    select floor(v_request.amount / credit_charge)::integer into v_credits
    from public.credit_wallets where user_id = v_request.user_id;

    insert into public.credit_transactions(user_id, transaction_type, credits, amount, description)
    values (v_request.user_id, 'credit', v_credits, v_request.amount, 'Credit top-up approved');
  end if;

  update public.credit_topup_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = nullif(btrim(p_admin_note), ''),
      reviewed_by = v_admin,
      reviewed_at = now()
  where id = p_request_id;
end;
$$;

revoke all on function public.review_credit_topup(uuid, boolean, text) from public, anon;
grant execute on function public.review_credit_topup(uuid, boolean, text) to authenticated;

-- Add the first administrator manually with:
-- insert into public.admin_users (user_id) values ('AUTH-USER-UUID');
