-- Fix infinite recursion on profiles SELECT policy.
-- The existing policy was causing recursion when reading profiles.
-- Replace with a direct auth.uid() check — no subquery into profiles.

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());
