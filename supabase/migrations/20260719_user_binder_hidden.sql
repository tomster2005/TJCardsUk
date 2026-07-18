create table if not exists user_binder_hidden (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null references binder_sets(id) on delete cascade,
  primary key (user_id, set_id)
);

alter table user_binder_hidden enable row level security;

create policy "Users manage their own hidden binders"
  on user_binder_hidden for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
