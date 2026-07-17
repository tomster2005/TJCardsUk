-- Allow admins to read all community images (any status) for moderation
create policy "Admin can read all community images"
  on community_images for select to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
