-- get_binder_checklist(p_set_id, p_user_id)
--
-- Returns the full merged checklist for a binder set in one round-trip.
-- Replaces:
--   • fetchAll(binder_checklist)          — 1+ paginated requests
--   • fetchAll(user_binder_progress)      — 1+ paginated requests (duplicate)
--   • chunked community_images loop       — up to N/20 sequential requests
--   • fetchAll(cards) for images/stock    — 1+ paginated requests
--   • fetchAll(personal_card_images)      — 1+ paginated requests
--
-- Security:
--   • Not SECURITY DEFINER — runs as the calling user, all RLS enforced.
--   • community_images: only approved rows visible (RLS enforced).
--   • personal_card_images: user_id = auth.uid() (RLS enforced).
--   • user_binder_progress: user-scoped (RLS enforced).
--
-- Note: return column is named "pos" rather than "position" because
-- "position" is a reserved word in PostgreSQL.

create or replace function public.get_binder_checklist(
  p_set_id  uuid,
  p_user_id uuid default null
)
returns table (
  id               uuid,
  set_id           uuid,
  card_number      text,
  player_name      text,
  team             text,
  parallel         text,
  page_number      integer,
  pos              integer,
  image_url        text,
  stock            integer,
  community_image  text,
  community_credit text,
  personal_image   text,
  storage_path     text,
  prefer_personal  boolean,
  collected        boolean
)
language sql
stable
as $$
  with
  card_images as (
    select
      c.card_number,
      coalesce(
        min(c.image_url) filter (where (c.parallel is null or c.parallel = '') and c.image_url is not null),
        min(c.image_url) filter (where c.image_url is not null)
      ) as image_url,
      sum(coalesce(c.stock, 0))::integer as total_stock
    from cards c
    where c.set_name = (select bs.title from binder_sets bs where bs.id = p_set_id)
    group by c.card_number
  ),

  community as (
    select distinct on (ci.checklist_id)
      ci.checklist_id,
      ci.image_url  as community_image,
      ci.username   as community_credit
    from community_images ci
    where ci.status = 'approved'
      and ci.checklist_id in (
        select bc.id from binder_checklist bc where bc.set_id = p_set_id
      )
    order by
      ci.checklist_id,
      (ci.username = 'Admin') desc,
      ci.created_at desc
  ),

  personal as (
    select
      pci.checklist_id,
      pci.image_url   as personal_image,
      pci.storage_path,
      coalesce(pci.prefer_personal, false) as prefer_personal
    from personal_card_images pci
    where pci.user_id = p_user_id
      and pci.checklist_id in (
        select bc.id from binder_checklist bc where bc.set_id = p_set_id
      )
  ),

  progress as (
    select ubp.checklist_id
    from user_binder_progress ubp
    where ubp.user_id = p_user_id
      and ubp.checklist_id in (
        select bc.id from binder_checklist bc where bc.set_id = p_set_id
      )
  )

  select
    bc.id,
    bc.set_id,
    bc.card_number,
    bc.player_name,
    bc.team,
    bc.parallel,
    bc.page_number,
    bc.position                                    as pos,
    coalesce(ci.image_url, comm.community_image)   as image_url,
    coalesce(ci.total_stock, 0)                    as stock,
    case when ci.image_url is null then comm.community_image end as community_image,
    case when ci.image_url is null then comm.community_credit end as community_credit,
    pers.personal_image,
    pers.storage_path,
    coalesce(pers.prefer_personal, false)           as prefer_personal,
    (prog.checklist_id is not null)                 as collected
  from binder_checklist bc
  left join card_images  ci   on ci.card_number    = bc.card_number
  left join community    comm on comm.checklist_id = bc.id
  left join personal     pers on pers.checklist_id = bc.id
  left join progress     prog on prog.checklist_id = bc.id
  where bc.set_id = p_set_id
  order by bc.page_number, bc.position
$$;

grant execute on function public.get_binder_checklist(uuid, uuid) to anon, authenticated;
