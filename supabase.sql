create extension if not exists pgcrypto;

create or replace function public.auto_confirm_creator_deal_manager_email()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if new.email is not null and new.email_confirmed_at is null then
    new.email_confirmed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_creator_deal_manager_email on auth.users;
create trigger auto_confirm_creator_deal_manager_email
before insert or update of email on auth.users
for each row
execute function public.auto_confirm_creator_deal_manager_email();

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  brand text,
  product_name text,
  product_category text,
  cooperation_date date,
  product_image_url text,
  platform text check (platform is null or platform in ('小红书', '抖音', '其他')),
  platforms text[] default '{}',
  advance_required boolean default false,
  collaboration_type text check (collaboration_type is null or collaboration_type in ('送拍', '寄拍')),
  product_price numeric,
  base_fee numeric,
  commission text,
  advance_amount numeric,
  received_date date,
  shoot_deadline date,
  shoot_date date,
  publish_deadline date,
  publish_date date,
  expected_payment_date date,
  payment_received boolean not null default false,
  payment_received_date date,
  expected_refund_date date,
  refund_received boolean not null default false,
  refund_received_date date,
  product_url text,
  publish_url text,
  notes text,
  completed boolean not null default false,
  archived_at timestamptz,
  deleted_at timestamptz
);

alter table public.deals
  add column if not exists product_category text;

alter table public.deals
  add column if not exists cooperation_date date;

alter table public.deals
  add column if not exists platforms text[] default '{}';

alter table public.deals
  add column if not exists advance_required boolean default false;

alter table public.deals
  add column if not exists collaboration_type text;

alter table public.deals
  add column if not exists deleted_at timestamptz;

update public.deals
set platforms = array[platform]
where platform is not null
  and platform <> ''
  and (platforms is null or cardinality(platforms) = 0);

create index if not exists deals_user_created_idx
  on public.deals (user_id, created_at desc);

create index if not exists deals_user_publish_deadline_idx
  on public.deals (user_id, publish_deadline);

create index if not exists deals_user_shoot_deadline_idx
  on public.deals (user_id, shoot_deadline);

create index if not exists deals_user_payment_date_idx
  on public.deals (user_id, expected_payment_date);

create index if not exists deals_user_refund_date_idx
  on public.deals (user_id, expected_refund_date);

create index if not exists deals_user_archived_idx
  on public.deals (user_id, archived_at);

create index if not exists deals_user_deleted_idx
  on public.deals (user_id, deleted_at);

create index if not exists deals_user_product_category_idx
  on public.deals (user_id, product_category);

create index if not exists deals_user_cooperation_date_idx
  on public.deals (user_id, cooperation_date);

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

create table if not exists public.daily_earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  earning_date date not null,
  amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, earning_date)
);

create index if not exists daily_earnings_user_date_idx
  on public.daily_earnings (user_id, earning_date desc);

drop trigger if exists daily_earnings_set_updated_at on public.daily_earnings;
create trigger daily_earnings_set_updated_at
before update on public.daily_earnings
for each row
execute function public.set_updated_at();

alter table public.daily_earnings enable row level security;

grant select, insert, update, delete on public.daily_earnings to authenticated;

drop policy if exists "Users can read own daily earnings" on public.daily_earnings;
create policy "Users can read own daily earnings"
on public.daily_earnings for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own daily earnings" on public.daily_earnings;
create policy "Users can insert own daily earnings"
on public.daily_earnings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own daily earnings" on public.daily_earnings;
create policy "Users can update own daily earnings"
on public.daily_earnings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own daily earnings" on public.daily_earnings;
create policy "Users can delete own daily earnings"
on public.daily_earnings for delete
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
