create extension if not exists pgcrypto;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  brand text,
  product_name text,
  product_image_url text,
  platform text check (platform is null or platform in ('小红书', '抖音', '其他')),
  product_price numeric,
  base_fee numeric,
  commission text,
  advance_amount numeric,
  received_date date,
  shoot_date date,
  publish_deadline date,
  publish_date date,
  expected_payment_date date,
  expected_refund_date date,
  product_url text,
  publish_url text,
  notes text
);

create index if not exists deals_user_created_idx
  on public.deals (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
before update on public.deals
for each row
execute function public.set_updated_at();

alter table public.deals enable row level security;

grant select, insert, update, delete on public.deals to authenticated;

drop policy if exists "Users can read own deals" on public.deals;
create policy "Users can read own deals"
on public.deals for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own deals" on public.deals;
create policy "Users can insert own deals"
on public.deals for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own deals" on public.deals;
create policy "Users can update own deals"
on public.deals for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own deals" on public.deals;
create policy "Users can delete own deals"
on public.deals for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deal-product-images',
  'deal-product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own product images" on storage.objects;
create policy "Users can upload own product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'deal-product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own product images" on storage.objects;
create policy "Users can update own product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'deal-product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'deal-product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can read product images" on storage.objects;
create policy "Users can read product images"
on storage.objects for select
to public
using (bucket_id = 'deal-product-images');
