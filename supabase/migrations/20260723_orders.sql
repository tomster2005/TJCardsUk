create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  sumup_checkout_id text not null unique,
  status text not null default 'paid' check (status in ('paid', 'refunded', 'disputed')),
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null,
  shipping_cost numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  shipping_name text,
  shipping_email text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_postcode text,
  shipping_method text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

alter table public.orders enable row level security;

-- Admins can read all orders
create policy "Admins can read all orders"
  on public.orders for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Users can read their own orders
create policy "Users can read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

-- Only service role can insert (done server-side in finalize route)
