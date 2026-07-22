-- card_copies: one row per physical card copy
create table if not exists public.card_copies (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  owner text not null check (owner in ('Tom', 'Jamie', 'Joint')),
  sold boolean not null default false,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists card_copies_card_id_idx on public.card_copies(card_id);
create index if not exists card_copies_sold_idx on public.card_copies(sold);

alter table public.card_copies enable row level security;

create policy "Admins can do everything on card_copies"
  on public.card_copies for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Backfill: generate copies from existing cards (all currently Joint as confirmed)
insert into public.card_copies (card_id, owner, sold)
select
  c.id,
  coalesce(c.owner, 'Joint'),
  false
from public.cards c
cross join generate_series(1, greatest(c.stock, 0)) as s
where c.stock > 0;
