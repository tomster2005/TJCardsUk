-- Missing indexes identified from actual application query patterns.
-- Every index below is justified by a specific query in the codebase.
-- Indexes already present are noted but not recreated.

-- ─────────────────────────────────────────────────────────────────────────────
-- cards
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Catalogue grid (CatalogueGrid.tsx)
--    WHERE status = 'published'
--    ORDER BY card_number ASC, parallel ASC
--    RANGE (paginated 48 at a time)
--
--    Without this index Postgres does a full table scan on every page load
--    and every infinite-scroll fetch. The (status, card_number) composite
--    lets the planner satisfy both the filter and the sort in one index scan.
--    parallel is included as a covering column so the ORDER BY parallel
--    clause doesn't require a separate sort step.
create index if not exists idx_cards_status_card_number_parallel
  on public.cards (status, card_number, parallel);

-- 2. Dashboard "recently added" (dashboard/page.tsx)
--    SELECT ... FROM cards  (no WHERE, ORDER BY created_at DESC, LIMIT 12)
--    Admin cards page (admin/cards/page.tsx)
--    SELECT * FROM cards ORDER BY created_at DESC
--
--    Both queries sort the entire table by created_at descending.
--    An index on (created_at DESC) lets Postgres read rows in order
--    without a sort step.
create index if not exists idx_cards_created_at_desc
  on public.cards (created_at desc);

-- 3. Variant fetch on card detail page (catalogue/[setSlug]/[cardSlug]/page.tsx)
--    and binder RPC card_images CTE (get_binder_checklist)
--    WHERE set_name = $1 [AND status = 'published']
--    GROUP BY card_number  (in the RPC)
--
--    Both queries filter by set_name. The card detail page also filters
--    by status. A composite (set_name, status, card_number) covers both
--    and avoids a separate sort/group step for the RPC aggregation.
--    Note: idx_cards_set_slug_card_slug_status already covers the slug
--    lookup path; this covers the set_name text path used by variants
--    and the binder RPC.
create index if not exists idx_cards_set_name_status_card_number
  on public.cards (set_name, status, card_number);

-- ─────────────────────────────────────────────────────────────────────────────
-- card_copies
-- ─────────────────────────────────────────────────────────────────────────────

-- 4. fulfil_order_items RPC (fulfil_order_items.sql)
--    WHERE card_id = $1 AND sold = false
--    ORDER BY created_at ASC
--    LIMIT $quantity
--    FOR UPDATE SKIP LOCKED
--
--    The existing separate indexes on (card_id) and (sold) are not useful
--    here — Postgres cannot combine two single-column indexes efficiently
--    for a hot-path locking query. A composite (card_id, sold, created_at)
--    lets the planner do a single index range scan, find unsold copies for
--    the card in FIFO order, and apply the row lock — all without a sort.
--
--    Admin cards page (admin/cards/page.tsx)
--    WHERE sold = false  (full fetch of all unsold copies for stock display)
--    This query is served by the (card_id, sold) prefix of the same index.
create index if not exists idx_card_copies_card_id_sold_created
  on public.card_copies (card_id, sold, created_at asc);

-- ─────────────────────────────────────────────────────────────────────────────
-- community_images
-- ─────────────────────────────────────────────────────────────────────────────

-- 5. Binder RPC community CTE (get_binder_checklist)
--    WHERE status = 'approved'
--      AND checklist_id IN (SELECT id FROM binder_checklist WHERE set_id = $1)
--    ORDER BY checklist_id, (username = 'Admin') DESC, created_at DESC
--
--    The existing separate indexes on (status) and (checklist_id) are not
--    useful for this combined filter. A composite (status, checklist_id,
--    created_at DESC) lets Postgres satisfy the equality filters and the
--    ordering in one scan. The DISTINCT ON (checklist_id) then picks the
--    best row per checklist entry cheaply.
create index if not exists idx_community_images_status_checklist_created
  on public.community_images (status, checklist_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- binder_sets
-- ─────────────────────────────────────────────────────────────────────────────

-- 6. Binder list load (Binder.tsx) and dashboard (dashboard/page.tsx)
--    WHERE is_active = true
--    ORDER BY created_at DESC
--
--    The binder selection screen and dashboard both filter by is_active.
--    Without an index Postgres scans all binder_sets rows (small table now,
--    but grows as more sets are added). A partial index on active sets only
--    is small and fast.
create index if not exists idx_binder_sets_active_created
  on public.binder_sets (is_active, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- pending_orders
-- ─────────────────────────────────────────────────────────────────────────────

-- 7. finalize route (app/api/sumup/finalize/route.ts)
--    WHERE sumup_checkout_id = $1   (lookup pending order)
--    DELETE WHERE sumup_checkout_id = $1  (cleanup after fulfilment)
--
--    pending_orders has no indexes at all. Every finalize call does a
--    sequential scan to find the pending order by checkout ID.
--    A unique index enforces idempotency (one pending order per checkout)
--    and makes both the lookup and delete O(log n).
create unique index if not exists idx_pending_orders_checkout_id
  on public.pending_orders (sumup_checkout_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Existing indexes confirmed present — not recreated
-- ─────────────────────────────────────────────────────────────────────────────
-- cards:              cards_owner_idx (owner)
--                     idx_cards_set_slug_card_slug_status (set_slug, card_slug, status)
--                     idx_cards_set_slug_status_parallel  (set_slug, status, parallel)
--                     idx_cards_variant_group             (variant_group_id)
-- card_copies:        card_copies_card_id_idx (card_id)   — superseded by #4 above
--                     card_copies_sold_idx    (sold)       — superseded by #4 above
-- binder_checklist:   idx_binder_checklist_set_id         (set_id)
--                     idx_binder_checklist_card_number    (set_id, card_number)
-- community_images:   idx_community_images_checklist      (checklist_id)  — superseded by #5
--                     idx_community_images_status         (status)        — superseded by #5
--                     idx_community_images_user           (uploaded_by)
-- user_binder_progress: idx_user_binder_progress_user_set (user_id, checklist_id)
-- personal_card_images: idx_personal_card_images_user     (user_id)
--                       idx_personal_card_images_checklist (checklist_id)
-- orders:             orders_created_at_idx  (created_at desc)
--                     orders_user_id_idx     (user_id)
--                     orders_status_idx      (status)
--                     sumup_checkout_id UNIQUE constraint (covers replay check)
-- user_binders:       idx_user_binders_user  (user_id)
-- user_binder_cards:  idx_user_binder_cards_binder (binder_id)
-- profiles:           profiles_role_idx      (role)
