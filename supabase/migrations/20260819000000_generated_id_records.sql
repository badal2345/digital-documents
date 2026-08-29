create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  document_data jsonb not null default '{}'::jsonb,
  document_url text,
  credits_used integer not null check (credits_used > 0),
  status text not null default 'generated' check (status in ('processing', 'generated', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists generated_documents_user_created_idx
on public.generated_documents(user_id, created_at desc);

alter table public.generated_documents enable row level security;
drop policy if exists "documents_select_own" on public.generated_documents;
create policy "documents_select_own" on public.generated_documents for select to authenticated
using ((select auth.uid()) = user_id);
grant select on public.generated_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-profile-pictures', 'id-profile-pictures', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "id_photos_insert_own" on storage.objects;
create policy "id_photos_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'id-profile-pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "id_photos_select_own" on storage.objects;
create policy "id_photos_select_own" on storage.objects for select to authenticated
using (bucket_id = 'id-profile-pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "id_photos_delete_own" on storage.objects;
create policy "id_photos_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'id-profile-pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- The charge is fixed here so a client cannot submit a cheaper value.
create or replace function public.generate_id_record(p_document_data jsonb, p_photo_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_document_data is null
    or not (p_document_data ?& array['aadhaarNumber','guardianName','fullName','houseNo','locality','postOffice','city','state','pincode','dob','gender','language'])
    or (p_document_data->>'aadhaarNumber') !~ '^\d{12}$'
    or (p_document_data->>'pincode') !~ '^\d{6}$'
    or p_photo_path is null
    or split_part(p_photo_path, '/', 1) <> v_user::text then
    raise exception 'Invalid document data';
  end if;

  update public.credit_wallets set credits_used = credits_used + 1, updated_at = now()
  where user_id = v_user and available_credits >= 1;
  if not found then raise exception 'Insufficient credits'; end if;

  insert into public.generated_documents(user_id, document_type, document_data, document_url, credits_used, status)
  values(v_user, 'Generated ID record', p_document_data, p_photo_path, 1, 'generated') returning id into v_id;
  insert into public.credit_transactions(user_id, transaction_type, credits, amount, description)
  values(v_user, 'debit', -1, -10, 'Generated ID record');
  return v_id;
end; $$;

revoke all on function public.generate_id_record(jsonb, text) from public, anon;
grant execute on function public.generate_id_record(jsonb, text) to authenticated;
