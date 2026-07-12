-- Add username to profiles
alter table public.profiles add column if not exists username text unique;

-- Update the handle_new_user trigger to save username from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, username)
  values (new.id, 'user', new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

-- Allow users to read any profile's username (for credit display)
create policy "Anyone can read usernames"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Drop the old restrictive select policy if it exists
drop policy if exists "Users can read own profile" on public.profiles;

-- Community images table
create table if not exists community_images (
  id uuid default gen_random_uuid() primary key,
  checklist_id uuid references binder_checklist(id) on delete cascade not null,
  image_url text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  username text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create index if not exists idx_community_images_checklist on community_images(checklist_id);
create index if not exists idx_community_images_status on community_images(status);
create index if not exists idx_community_images_user on community_images(uploaded_by);

-- RLS
alter table community_images enable row level security;

-- Anyone can read approved images
create policy "Public can read approved community images"
  on community_images for select to anon, authenticated
  using (status = 'approved');

-- Authenticated users can read their own submissions (any status)
create policy "Users can read own submissions"
  on community_images for select to authenticated
  using (uploaded_by = auth.uid());

-- Authenticated can insert
create policy "Authenticated can upload community images"
  on community_images for insert to authenticated
  with check (uploaded_by = auth.uid());

-- Admin can update (approve/reject) - using profiles role check
create policy "Admin can update community images"
  on community_images for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Admin can delete
create policy "Admin can delete community images"
  on community_images for delete to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
