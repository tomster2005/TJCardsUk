-- Fix overly permissive RLS policies
-- 1. cards table — was missing RLS entirely
-- 2. binder_sets / binder_checklist — writes were open to all authenticated users, not just admins

-- ─── cards ───────────────────────────────────────────────────────────────────

alter table public.cards enable row level security;

-- Anyone can read published cards
create policy "Public can read published cards"
  on public.cards for select
  to anon, authenticated
  using (status = 'published');

-- Admins can read all cards (including drafts)
create policy "Admins can read all cards"
  on public.cards for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Only admins can insert/update/delete cards
create policy "Admins can insert cards"
  on public.cards for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update cards"
  on public.cards for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete cards"
  on public.cards for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── binder_sets ─────────────────────────────────────────────────────────────

-- Drop the overly permissive write policies
drop policy if exists "Authenticated can insert binder sets" on binder_sets;
drop policy if exists "Authenticated can update binder sets" on binder_sets;
drop policy if exists "Authenticated can delete binder sets" on binder_sets;

-- Replace with admin-only
create policy "Admins can insert binder sets"
  on binder_sets for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update binder sets"
  on binder_sets for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete binder sets"
  on binder_sets for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── binder_checklist ────────────────────────────────────────────────────────

-- Drop the overly permissive write policies
drop policy if exists "Authenticated can insert binder checklist" on binder_checklist;
drop policy if exists "Authenticated can update binder checklist" on binder_checklist;
drop policy if exists "Authenticated can delete binder checklist" on binder_checklist;

-- Replace with admin-only
create policy "Admins can insert binder checklist"
  on binder_checklist for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update binder checklist"
  on binder_checklist for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete binder checklist"
  on binder_checklist for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
