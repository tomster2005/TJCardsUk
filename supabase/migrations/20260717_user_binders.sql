create table if not exists user_binders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  set_name text not null,
  year text not null,
  cover_image_url text,
  published boolean default false,
  created_at timestamptz default now()
);

create table if not exists user_binder_cards (
  id uuid default gen_random_uuid() primary key,
  binder_id uuid references user_binders(id) on delete cascade not null,
  player_name text not null,
  card_number text not null,
  set_name text not null,
  image_url text,
  position integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_user_binders_user on user_binders(user_id);
create index if not exists idx_user_binder_cards_binder on user_binder_cards(binder_id);

alter table user_binders enable row level security;
alter table user_binder_cards enable row level security;

-- Users can read their own binders
create policy "Users can read own binders"
  on user_binders for select to authenticated
  using (user_id = auth.uid());

-- Anyone can read published binders
create policy "Public can read published binders"
  on user_binders for select to anon, authenticated
  using (published = true);

create policy "Users can insert own binders"
  on user_binders for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own binders"
  on user_binders for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own binders"
  on user_binders for delete to authenticated
  using (user_id = auth.uid());

-- Admin full access
create policy "Admin can read all user binders"
  on user_binders for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin can update all user binders"
  on user_binders for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin can delete all user binders"
  on user_binders for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Cards: users can manage cards in their own binders
create policy "Users can read own binder cards"
  on user_binder_cards for select to authenticated
  using (exists (select 1 from user_binders where id = binder_id and user_id = auth.uid()));

create policy "Public can read cards in published binders"
  on user_binder_cards for select to anon, authenticated
  using (exists (select 1 from user_binders where id = binder_id and published = true));

create policy "Users can insert cards into own binders"
  on user_binder_cards for insert to authenticated
  with check (exists (select 1 from user_binders where id = binder_id and user_id = auth.uid()));

create policy "Users can update cards in own binders"
  on user_binder_cards for update to authenticated
  using (exists (select 1 from user_binders where id = binder_id and user_id = auth.uid()));

create policy "Users can delete cards from own binders"
  on user_binder_cards for delete to authenticated
  using (exists (select 1 from user_binders where id = binder_id and user_id = auth.uid()));

create policy "Admin can read all binder cards"
  on user_binder_cards for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
