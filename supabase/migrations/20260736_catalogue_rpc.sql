-- get_catalogue_page
-- Returns one page of catalogue cards with server-side filtering, sorting,
-- variant grouping and pagination.
--
-- Columns selected match only those confirmed to exist in migrations:
--   image_url, back_image_url, team, brand, season, parallel, rarity,
--   print_run, category, owner, storage_location, variant_group_id,
--   is_base_variant, set_slug, card_slug
-- Columns NOT selected (do not exist in any migration):
--   is_one_of_one, condition, population, marketplace_price, estimated_value

create or replace function public.get_catalogue_page(
  p_set_name  text    default null,
  p_team      text    default null,
  p_parallel  text    default null,
  p_category  text    default null,
  p_in_stock  boolean default false,
  p_search    text    default null,
  p_sort      text    default 'cardNumber',
  p_limit     int     default 48,
  p_offset    int     default 0
)
returns table (
  id               uuid,
  player           text,
  card_number      text,
  set_name         text,
  set_slug         text,
  card_slug        text,
  team             text,
  brand            text,
  parallel         text,
  category         text,
  price            numeric,
  stock            integer,
  status           text,
  image_url        text,
  back_image_url   text,
  season           text,
  print_run        text,
  variant_group_id uuid,
  is_base_variant  boolean,
  parallel_names   text[],
  total_count      bigint
)
language sql
stable
as $$
  with

  -- Pick one representative row per variant group.
  -- Prefer is_base_variant = true, then parallel IS NULL, then first by card_number.
  base_cards as (
    select distinct on (
      coalesce(variant_group_id::text, set_name || '__' || card_number)
    )
      id, player, card_number, set_name, set_slug, card_slug,
      team, brand, parallel, category, price, stock, status,
      image_url, back_image_url, season, print_run,
      variant_group_id, is_base_variant,
      coalesce(variant_group_id::text, set_name || '__' || card_number) as group_key
    from public.cards
    where status = 'published'
    order by
      coalesce(variant_group_id::text, set_name || '__' || card_number),
      (is_base_variant = true) desc,
      (parallel is null) desc,
      card_number
  ),

  -- Collect all parallel names per group for the variant selector UI.
  parallel_agg as (
    select
      coalesce(variant_group_id::text, set_name || '__' || card_number) as group_key,
      array_agg(parallel order by parallel)
        filter (where parallel is not null and parallel <> '') as parallel_names
    from public.cards
    where status = 'published'
    group by coalesce(variant_group_id::text, set_name || '__' || card_number)
  ),

  -- Apply all filters after grouping.
  filtered as (
    select
      b.*,
      coalesce(pa.parallel_names, '{}'::text[]) as parallel_names
    from base_cards b
    left join parallel_agg pa on pa.group_key = b.group_key
    where
      (p_set_name is null or b.set_name = p_set_name)
      and (p_team is null or b.team = p_team)
      and (p_category is null or b.category = p_category)
      and (not p_in_stock or b.stock > 0)
      and (
        p_parallel is null
        or (p_parallel = '' and (b.parallel is null or b.parallel = ''))
        or (p_parallel <> '' and pa.parallel_names @> array[p_parallel])
      )
      and (
        p_search is null
        or p_search = ''
        or b.player ilike '%' || p_search || '%'
        or b.card_number ilike '%' || p_search || '%'
        or b.set_name ilike '%' || p_search || '%'
      )
  ),

  -- Window count so the client knows the total without a second query.
  counted as (
    select *, count(*) over () as total_count
    from filtered
  )

  select
    id, player, card_number, set_name, set_slug, card_slug,
    team, brand, parallel, category,
    price, stock, status, image_url, back_image_url,
    season, print_run,
    variant_group_id, is_base_variant,
    parallel_names,
    total_count
  from counted
  order by
    case when p_sort = 'playerName' then player        end asc  nulls last,
    case when p_sort = 'priceLow'   then price         end asc  nulls last,
    case when p_sort = 'priceHigh'  then price         end desc nulls last,
    case when p_sort = 'cardNumber' or p_sort is null
         then (nullif(regexp_replace(card_number, '[^0-9]', '', 'g'), ''))::bigint
    end asc nulls last,
    card_number asc,
    id asc
  limit  p_limit
  offset p_offset
$$;

grant execute on function public.get_catalogue_page(text,text,text,text,boolean,text,text,int,int)
  to anon, authenticated;


-- get_catalogue_filters
-- Returns distinct sets, teams and parallels for the filter dropdowns.
-- Teams and parallels are scoped to the current set/category selection.

create or replace function public.get_catalogue_filters(
  p_set_name text default null,
  p_category text default null
)
returns table (
  sets      text[],
  teams     text[],
  parallels text[]
)
language sql
stable
as $$
  select
    array(
      select distinct set_name
      from public.cards
      where status = 'published' and set_name is not null
      order by set_name
    ),
    array(
      select distinct team
      from public.cards
      where status = 'published'
        and team is not null and team <> ''
        and (p_set_name is null or set_name = p_set_name)
        and (p_category is null or category = p_category)
      order by team
    ),
    array(
      select distinct parallel
      from public.cards
      where status = 'published'
        and parallel is not null and parallel <> ''
        and (p_set_name is null or set_name = p_set_name)
        and (p_category is null or category = p_category)
      order by parallel
    )
$$;

grant execute on function public.get_catalogue_filters(text, text)
  to anon, authenticated;
