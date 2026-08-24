-- Add indexed slug columns to cards so individual card pages can be
-- fetched with a single indexed query instead of fetching all cards.
--
-- set_slug  = slugified set_name
-- card_slug = slugified (title or player) + card_number
--
-- These mirror the logic in lib/cards/slug.ts buildPublicCardSlugs().

alter table public.cards
  add column if not exists set_slug  text,
  add column if not exists card_slug text;

-- Slug generation function — mirrors buildSlugPart() in lib/cards/slug.ts
create or replace function public.generate_card_slug(
  p_set_name    text,
  p_title       text,
  p_player      text,
  p_card_number text
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_set_slug  text;
  v_card_slug text;
  v_title     text;
  v_combined  text;
begin
  -- slugify: lowercase, collapse non-alphanumeric runs to hyphens, trim hyphens
  v_set_slug := regexp_replace(
    regexp_replace(lower(coalesce(p_set_name, 'set')), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g'
  );
  if v_set_slug = '' then v_set_slug := 'set'; end if;

  v_title := coalesce(nullif(trim(p_title), ''), nullif(trim(p_player), ''), '');
  v_combined := trim(v_title || ' ' || coalesce(p_card_number, ''));
  v_card_slug := regexp_replace(
    regexp_replace(lower(v_combined), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g'
  );
  if v_card_slug = '' then v_card_slug := 'card'; end if;

  return jsonb_build_object('set_slug', v_set_slug, 'card_slug', v_card_slug);
end;
$$;

-- Backfill existing rows
update public.cards
set
  set_slug  = (public.generate_card_slug(set_name, title, player, card_number::text))->>'set_slug',
  card_slug = (public.generate_card_slug(set_name, title, player, card_number::text))->>'card_slug'
where set_slug is null or card_slug is null;

-- Trigger function to keep slugs in sync on insert/update
create or replace function public.sync_card_slugs()
returns trigger
language plpgsql
as $$
declare
  v_slugs jsonb;
begin
  v_slugs := public.generate_card_slug(
    new.set_name,
    new.title,
    new.player,
    new.card_number::text
  );
  new.set_slug  := v_slugs->>'set_slug';
  new.card_slug := v_slugs->>'card_slug';
  return new;
end;
$$;

drop trigger if exists trg_sync_card_slugs on public.cards;
create trigger trg_sync_card_slugs
before insert or update of set_name, title, player, card_number
on public.cards
for each row
execute function public.sync_card_slugs();

-- Composite index for the card detail page lookup
create index if not exists idx_cards_set_slug_card_slug_status
  on public.cards (set_slug, card_slug, status);

-- Index for the related cards query (same set, published, base cards)
create index if not exists idx_cards_set_slug_status_parallel
  on public.cards (set_slug, status, parallel);
