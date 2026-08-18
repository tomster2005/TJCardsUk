-- Avatar URL on profiles
alter table public.profiles add column if not exists avatar_url text;

-- Showcase: up to 6 pinned checklist cards per user
create table if not exists public.profile_showcase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_id uuid not null references binder_checklist(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, checklist_id)
);

create index if not exists idx_profile_showcase_user on public.profile_showcase(user_id);

alter table public.profile_showcase enable row level security;

create policy "Users can read own showcase" on public.profile_showcase for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own showcase" on public.profile_showcase for insert to authenticated with check (user_id = auth.uid());
create policy "Users can delete own showcase" on public.profile_showcase for delete to authenticated using (user_id = auth.uid());
