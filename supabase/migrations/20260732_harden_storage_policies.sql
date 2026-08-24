-- Harden storage upload policies with MIME type and file size limits.
-- Supabase Storage exposes metadata->>'mimetype' and metadata->>'size' on the
-- storage.objects row at insert time, so we can enforce them in RLS policies.

-- ─── Allowed MIME types helper ────────────────────────────────────────────────

-- Drop and recreate hardened insert policies for each bucket.
-- Existing select/update/delete policies are unchanged.

-- ─── avatars bucket ───────────────────────────────────────────────────────────

drop policy if exists "Users can upload own avatar" on storage.objects;

create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (metadata->>'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
    and (metadata->>'size')::bigint <= 5242880  -- 5 MB
  );

-- ─── personal-card-images bucket ─────────────────────────────────────────────

drop policy if exists "Users can upload own personal card images" on storage.objects;

create policy "Users can upload own personal card images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'personal-card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (metadata->>'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
    and (metadata->>'size')::bigint <= 10485760  -- 10 MB
  );

-- ─── card-images bucket (admin catalogue scans) ───────────────────────────────
-- Admins upload raw camera scans — allow JPEG/PNG/WEBP, 50 MB max.

drop policy if exists "Admins can upload card images" on storage.objects;

create policy "Admins can upload card images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-images'
    and public.get_my_role() = 'admin'
    and (metadata->>'mimetype') in ('image/jpeg', 'image/png', 'image/webp')
    and (metadata->>'size')::bigint <= 52428800  -- 50 MB
  );
