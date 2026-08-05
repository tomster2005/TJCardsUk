create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('free_shipping')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.discount_codes enable row level security;

-- Only admins can manage codes
create policy "Admins can do everything on discount_codes"
  on public.discount_codes for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Insert your launch code
insert into public.discount_codes (code, type) values ('FREESHIP', 'free_shipping');
