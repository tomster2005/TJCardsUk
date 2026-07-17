create table if not exists personal_card_images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  checklist_id uuid references binder_checklist(id) on delete cascade not null,
  image_url text not null,
  created_at timestamptz default now(),
  unique (user_id, checklist_id)
);

create index if not exists idx_personal_card_images_user on personal_card_images(user_id);
create index if not exists idx_personal_card_images_checklist on personal_card_images(checklist_id);

alter table personal_card_images enable row level security;

create policy "Users can read own personal images"
  on personal_card_images for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own personal images"
  on personal_card_images for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own personal images"
  on personal_card_images for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own personal images"
  on personal_card_images for delete to authenticated
  using (user_id = auth.uid());
