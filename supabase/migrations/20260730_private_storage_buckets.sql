-- ─── avatars bucket (public) ─────────────────────────────────────────────────
-- Separate from card-images so user assets are isolated from catalogue assets.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Public can view avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- ─── personal-card-images bucket (private) ───────────────────────────────────
-- Private bucket — no public read. Signed URLs used at render time.
insert into storage.buckets (id, name, public)
values ('personal-card-images', 'personal-card-images', false)
on conflict (id) do nothing;

create policy "Users can upload own personal card images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'personal-card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own personal card images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'personal-card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own personal card images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'personal-card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own personal card images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'personal-card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── personal_card_images table: add storage_path column ─────────────────────
-- New uploads store the object path here. image_url kept for old rows.
alter table personal_card_images
  add column if not exists storage_path text;
