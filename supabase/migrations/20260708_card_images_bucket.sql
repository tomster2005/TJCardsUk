-- Milestone: Card images storage bucket
-- Run this in the Supabase SQL Editor.

-- Create the storage bucket for card images (private, admin-only upload)
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

-- Allow authenticated admins to upload
create policy "Admins can upload card images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow public read access (images are displayed on the site)
create policy "Public can view card images"
  on storage.objects for select
  to public
  using (bucket_id = 'card-images');

-- Allow admins to delete card images
create policy "Admins can delete card images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'card-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
