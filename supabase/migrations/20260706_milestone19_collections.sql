-- Milestone 19: user collection foundation
-- Run this migration in Supabase SQL editor or your migration pipeline.

create table if not exists public.user_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  condition text not null default 'Near Mint',
  grading_company text,
  grade text,
  purchase_price numeric(10,2),
  estimated_value numeric(10,2),
  date_added timestamptz not null default now(),
  notes text,
  favourite boolean not null default false,
  for_trade boolean not null default false,
  for_sale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_collections_user_id_idx on public.user_collections(user_id);
create index if not exists user_collections_card_id_idx on public.user_collections(card_id);
create index if not exists user_collections_user_card_idx on public.user_collections(user_id, card_id);
create index if not exists user_collections_date_added_idx on public.user_collections(date_added desc);

create or replace function public.update_user_collections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_collections_updated_at on public.user_collections;
create trigger trg_user_collections_updated_at
before update on public.user_collections
for each row
execute function public.update_user_collections_updated_at();

alter table public.user_collections enable row level security;

-- RLS policies
create policy if not exists "Users can read their own collection"
on public.user_collections
for select
using (auth.uid() = user_id);

create policy if not exists "Users can insert their own collection rows"
on public.user_collections
for insert
with check (auth.uid() = user_id);

create policy if not exists "Users can update their own collection rows"
on public.user_collections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can delete their own collection rows"
on public.user_collections
for delete
using (auth.uid() = user_id);
