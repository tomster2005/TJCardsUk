-- User-specific binder progress: tracks which checklist cards a user has marked as collected
create table if not exists user_binder_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_id uuid not null references binder_checklist(id) on delete cascade,
  collected_at timestamptz not null default now(),
  unique(user_id, checklist_id)
);

-- RLS
alter table user_binder_progress enable row level security;

create policy "Users can view their own progress"
  on user_binder_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on user_binder_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own progress"
  on user_binder_progress for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index idx_user_binder_progress_user_set on user_binder_progress(user_id, checklist_id);
