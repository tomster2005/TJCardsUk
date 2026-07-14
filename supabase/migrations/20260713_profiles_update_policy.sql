-- Allow users to update their own profile (username only, not role)
-- The role column is protected by the trigger/application logic

create policy "Users can update own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
