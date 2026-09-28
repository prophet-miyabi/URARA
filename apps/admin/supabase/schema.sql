-- URARA: 顧客プロフィール・予約テーブル
-- Supabaseダッシュボードの「SQL Editor」で実行してください。

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  address text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  location_name text not null,
  location_address text not null,
  location_lat double precision,
  location_lng double precision,
  booking_type text not null check (booking_type in ('now', 'scheduled')),
  requested_datetime timestamptz not null,
  guest_count integer not null,
  companion_count integer not null,
  duration_hours integer not null,
  payment_method text not null,
  notes text not null default '',
  status text not null default 'received'
    check (status in ('received', 'arranging', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_customer_id_idx on public.reservations(customer_id);

-- Row Level Security: 本人の行だけ読み書きできる。管理画面はservice_roleキー
-- （RLSを無視する特権キー）でアクセスするため、ここでは顧客側の権限だけを絞る。
alter table public.customers enable row level security;
alter table public.reservations enable row level security;

create policy "customers_select_own" on public.customers
  for select using (auth.uid() = id);

create policy "customers_insert_own" on public.customers
  for insert with check (auth.uid() = id);

create policy "customers_update_own" on public.customers
  for update using (auth.uid() = id);

create policy "reservations_select_own" on public.reservations
  for select using (auth.uid() = customer_id);

create policy "reservations_insert_own" on public.reservations
  for insert with check (auth.uid() = customer_id);
