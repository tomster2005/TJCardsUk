-- Add owner column to cards
alter table public.cards
  add column if not exists owner text check (owner in ('Tom', 'Jamie', 'Joint')) default null;

create index if not exists cards_owner_idx on public.cards(owner);
