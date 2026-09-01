-- Phase 1: customers + blacklist, with Postgres functions for Supabase Auth
-- Hooks (Before User Created / Custom Access Token) to enforce the blacklist
-- server-side. See the notes at the bottom for wiring these functions up in
-- the Supabase Dashboard (Authentication -> Hooks) — the exact hook event
-- payload shape should be double-checked against Supabase's current docs
-- when enabling them, since this API has changed across Supabase versions.

create table if not exists public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone_number text not null unique,
  birth_date date,
  email text,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.blacklist (
  phone_number text primary key,
  email text,
  full_name text,
  banned_at timestamptz not null default now(),
  reason text
);

alter table public.customers enable row level security;
alter table public.blacklist enable row level security;

-- customers: a signed-in user may only ever see/insert their own row.
-- No update/delete policy yet (profile editing is a later phase).
create policy "customers_select_own" on public.customers
  for select using (auth.uid() = id);

create policy "customers_insert_own" on public.customers
  for insert with check (auth.uid() = id);

-- blacklist: intentionally has ZERO policies, so every request from the
-- anon/authenticated roles is denied by RLS. Only the service_role key
-- (server-side only, e.g. from apps/admin) or SECURITY DEFINER functions
-- below can read/write it. This table is itself sensitive customer data
-- (phone/email/name of banned users) and must never be client-readable.

-- Blocks account creation for a phone number already on the blacklist.
-- Register as a "Before User Created" Auth Hook in the Supabase Dashboard.
create or replace function public.check_blacklist_before_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  phone text;
begin
  -- NOTE: verify this is the correct path for the phone number in the
  -- "Before User Created" hook payload against current Supabase docs —
  -- written from documented examples, not verified against a live project.
  phone := event #>> '{user,phone}';

  if phone is not null and exists (
    select 1 from public.blacklist where phone_number = phone
  ) then
    raise exception 'このアカウントは利用停止されています'
      using errcode = 'P0001';
  end if;

  return event;
end;
$$;

-- Blocks token issuance (i.e. every login) for a user whose profile is
-- already flagged is_banned = true. Register as a "Custom Access Token"
-- Auth Hook in the Supabase Dashboard. Covers the case where a customer
-- registered before being blacklisted for a later no-show.
create or replace function public.check_banned_before_token(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_banned_user boolean;
  user_id uuid;
begin
  user_id := (event ->> 'user_id')::uuid;

  select is_banned into is_banned_user
  from public.customers
  where id = user_id;

  if is_banned_user then
    raise exception 'このアカウントは利用停止されています'
      using errcode = 'P0001';
  end if;

  return event;
end;
$$;

-- Called from apps/admin (service_role) when an operator marks a
-- reservation as no_show — adds the customer to the blacklist and flags
-- their profile. Wired up in Phase 3, defined now since the tables already
-- exist.
create or replace function public.ban_customer(
  p_phone_number text,
  p_email text,
  p_full_name text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.blacklist (phone_number, email, full_name, reason)
  values (p_phone_number, p_email, p_full_name, p_reason)
  on conflict (phone_number) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        reason = excluded.reason,
        banned_at = now();

  update public.customers
  set is_banned = true
  where phone_number = p_phone_number;
end;
$$;
