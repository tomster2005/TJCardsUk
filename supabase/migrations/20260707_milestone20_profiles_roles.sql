-- Milestone 20: User profiles and application roles
-- Run this migration in the Supabase SQL Editor.
--
-- ARCHITECTURE NOTES:
-- • auth.users (managed by Supabase Auth) handles authentication only.
-- • public.profiles stores Collectra-specific account data including the app role.
-- • Application roles must NEVER be accepted from registration form input.
-- • New accounts always receive the 'user' role via a database trigger.
-- • Role promotion is a manual admin action performed in the SQL editor.

-- ─── 1. Role enum ───────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role'
      and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('user', 'admin');
  end if;
end
$$;

-- ─── 2. Profiles table ──────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  role       public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Collectra application profile. Linked 1:1 to auth.users. Stores role and app-level metadata.';
comment on column public.profiles.role is
  'Application role. Must never be set from client input. Defaults to user. Only promote via SQL editor.';

-- ─── 3. Enable RLS ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- ─── 4. SELECT policy — users can read only their own profile ───────────────────

create policy "Users can read own profile"
  on public.profiles
  for select
  using (id = auth.uid());

-- No INSERT, UPDATE, or DELETE policies are created intentionally.
-- Users must not be able to:
--   • create arbitrary profile rows
--   • change their own role
--   • delete their profile
--   • read another user's profile

-- ─── 5. updated_at trigger function ────────────────────────────────────────────

create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_profiles_updated_at();

-- ─── 6. Auto-create profile on new auth signup ─────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Automatically creates a profiles row when a new auth.users row is inserted. Always sets role to user.';

-- Drop if exists to make migration re-runnable
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── 7. Backfill existing users ────────────────────────────────────────────────

insert into public.profiles (id, role)
select id, 'user'::public.app_role
from auth.users
on conflict (id) do nothing;

-- ─── 8. Index for role lookups (useful for future admin queries) ────────────────

create index if not exists profiles_role_idx on public.profiles(role);
