-- Fix infinite recursion in profiles RLS policies.
--
-- Root cause: policies on profiles were querying profiles themselves,
-- causing Postgres to recurse infinitely.
--
-- Fix: a security definer function reads the role directly, bypassing RLS.

-- ─── Helper function (bypasses RLS via security definer) ─────────────────────

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- Grant execute to authenticated users only
revoke execute on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated;

-- ─── Fix profiles policies ────────────────────────────────────────────────────

-- Drop the recursive update policy
drop policy if exists "Users can update own profile" on public.profiles;

-- Replace with non-recursive version: role column must stay the same
-- We use get_my_role() which is security definer and won't recurse
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role::text = public.get_my_role());

-- ─── Fix cards policies ───────────────────────────────────────────────────────

drop policy if exists "Admins can read all cards" on public.cards;
drop policy if exists "Admins can insert cards" on public.cards;
drop policy if exists "Admins can update cards" on public.cards;
drop policy if exists "Admins can delete cards" on public.cards;

create policy "Admins can read all cards"
  on public.cards for select
  to authenticated
  using (public.get_my_role() = 'admin');

create policy "Admins can insert cards"
  on public.cards for insert
  to authenticated
  with check (public.get_my_role() = 'admin');

create policy "Admins can update cards"
  on public.cards for update
  to authenticated
  using (public.get_my_role() = 'admin');

create policy "Admins can delete cards"
  on public.cards for delete
  to authenticated
  using (public.get_my_role() = 'admin');

-- ─── Fix binder_sets policies ─────────────────────────────────────────────────

drop policy if exists "Admins can insert binder sets" on public.binder_sets;
drop policy if exists "Admins can update binder sets" on public.binder_sets;
drop policy if exists "Admins can delete binder sets" on public.binder_sets;

create policy "Admins can insert binder sets"
  on public.binder_sets for insert
  to authenticated
  with check (public.get_my_role() = 'admin');

create policy "Admins can update binder sets"
  on public.binder_sets for update
  to authenticated
  using (public.get_my_role() = 'admin');

create policy "Admins can delete binder sets"
  on public.binder_sets for delete
  to authenticated
  using (public.get_my_role() = 'admin');

-- ─── Fix binder_checklist policies ───────────────────────────────────────────

drop policy if exists "Admins can insert binder checklist" on public.binder_checklist;
drop policy if exists "Admins can update binder checklist" on public.binder_checklist;
drop policy if exists "Admins can delete binder checklist" on public.binder_checklist;

create policy "Admins can insert binder checklist"
  on public.binder_checklist for insert
  to authenticated
  with check (public.get_my_role() = 'admin');

create policy "Admins can update binder checklist"
  on public.binder_checklist for update
  to authenticated
  using (public.get_my_role() = 'admin');

create policy "Admins can delete binder checklist"
  on public.binder_checklist for delete
  to authenticated
  using (public.get_my_role() = 'admin');

-- ─── Fix community_images admin policies ─────────────────────────────────────

drop policy if exists "Admin can update community images" on public.community_images;
drop policy if exists "Admin can delete community images" on public.community_images;
drop policy if exists "Admin can read all community images" on public.community_images;

create policy "Admin can update community images"
  on public.community_images for update
  to authenticated
  using (public.get_my_role() = 'admin');

create policy "Admin can delete community images"
  on public.community_images for delete
  to authenticated
  using (public.get_my_role() = 'admin');

create policy "Admin can read all community images"
  on public.community_images for select
  to authenticated
  using (public.get_my_role() = 'admin');
