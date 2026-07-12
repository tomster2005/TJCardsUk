-- Binder sets (each represents a full card set checklist)
create table if not exists binder_sets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  set_name text,
  total_cards integer default 0,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Binder checklist (every card in the set, whether you own it or not)
create table if not exists binder_checklist (
  id uuid default gen_random_uuid() primary key,
  set_id uuid references binder_sets(id) on delete cascade not null,
  card_number text not null,
  player_name text not null,
  team text,
  parallel text default 'Base',
  page_number integer not null,
  position integer not null,
  created_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_binder_checklist_set_id on binder_checklist(set_id);
create index if not exists idx_binder_checklist_card_number on binder_checklist(set_id, card_number);

-- RLS
alter table binder_sets enable row level security;
alter table binder_checklist enable row level security;

-- Public read
create policy "Public can read binder sets" on binder_sets for select to anon, authenticated using (true);
create policy "Public can read binder checklist" on binder_checklist for select to anon, authenticated using (true);

-- Authenticated write
create policy "Authenticated can insert binder sets" on binder_sets for insert to authenticated with check (true);
create policy "Authenticated can update binder sets" on binder_sets for update to authenticated using (true);
create policy "Authenticated can delete binder sets" on binder_sets for delete to authenticated using (true);

create policy "Authenticated can insert binder checklist" on binder_checklist for insert to authenticated with check (true);
create policy "Authenticated can update binder checklist" on binder_checklist for update to authenticated using (true);
create policy "Authenticated can delete binder checklist" on binder_checklist for delete to authenticated using (true);
