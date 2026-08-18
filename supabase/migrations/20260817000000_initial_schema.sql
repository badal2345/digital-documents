create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null, phone_number text not null unique, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.credit_wallets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  credit_charge numeric(12,2) not null default 10 check(credit_charge=10),
  total_amount numeric(12,2) not null default 1000 check(total_amount>=0),
  credits_used integer not null default 0 check(credits_used>=0),
  total_credits integer generated always as (floor(total_amount/credit_charge)::integer) stored,
  available_credits integer generated always as ((floor(total_amount/credit_charge)::integer)-credits_used) stored,
  amount_used numeric(12,2) generated always as (credits_used*credit_charge) stored,
  updated_at timestamptz not null default now(),
  check(credits_used<=floor(total_amount/credit_charge)::integer)
);
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check(transaction_type in ('credit','debit')), credits integer not null, amount numeric(12,2) not null default 0,
  description text not null, created_at timestamptz not null default now()
);
create table public.generated_documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null, document_data jsonb not null default '{}'::jsonb, document_url text, credits_used integer not null check(credits_used>0),
  status text not null default 'generated' check(status in ('processing','generated','failed')), created_at timestamptz not null default now()
);

create index on public.credit_transactions(user_id,created_at desc);
create index on public.generated_documents(user_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.generated_documents enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "wallets_select_own" on public.credit_wallets for select to authenticated using ((select auth.uid())=user_id);
create policy "transactions_select_own" on public.credit_transactions for select to authenticated using ((select auth.uid())=user_id);
create policy "documents_select_own" on public.generated_documents for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(user_id,full_name,phone_number) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','User'),coalesce(new.phone,new.raw_user_meta_data->>'phone_number'));
  insert into public.credit_wallets(user_id) values(new.id);
  insert into public.credit_transactions(user_id,transaction_type,credits,amount,description) values(new.id,'credit',100,1000,'Welcome credits');
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Atomic, authenticated document generation prevents negative balances and duplicate partial writes.
create or replace function public.generate_demo_document(p_document_data jsonb,p_credits integer default 10)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_credits <= 0 then raise exception 'Invalid credit amount'; end if;
  update public.credit_wallets set credits_used=credits_used+p_credits,updated_at=now()
    where user_id=v_user and available_credits>=p_credits;
  if not found then raise exception 'Insufficient credits'; end if;
  insert into public.generated_documents(user_id,document_type,document_data,credits_used,status)
    values(v_user,'Aadhaar Demo — SAMPLE NOT VALID ID',p_document_data,p_credits,'generated') returning id into v_id;
  insert into public.credit_transactions(user_id,transaction_type,credits,amount,description)
    values(v_user,'debit',-p_credits,-(p_credits*10),'Generated watermarked Aadhaar demo');
  return v_id;
end; $$;
revoke all on function public.generate_demo_document(jsonb,integer) from public,anon;
grant execute on function public.generate_demo_document(jsonb,integer) to authenticated;

grant usage on schema public to anon,authenticated;
grant select,update on public.profiles to authenticated;
grant select on public.credit_wallets,public.credit_transactions,public.generated_documents to authenticated;
