-- fulfil_order_items
-- Atomically claims card_copies for a list of purchased items.
-- Uses FOR UPDATE SKIP LOCKED so concurrent calls never claim the same copy.
-- Returns a JSON array of fulfilled items, or raises an exception if any
-- item cannot be fulfilled (insufficient unsold copies).
--
-- Run this in the Supabase SQL editor (as postgres / service role).

create or replace function fulfil_order_items(
  p_items jsonb   -- [{ "cardId": uuid, "playerName": text, "quantity": int, "price": numeric }]
)
returns jsonb
language plpgsql
security definer  -- runs as the function owner (postgres), bypasses RLS
as $$
declare
  v_item          jsonb;
  v_card_id       uuid;
  v_quantity      int;
  v_player_name   text;
  v_price         numeric;

  v_copies        jsonb;
  v_copy_ids      uuid[];
  v_owner         text;

  v_current_stock int;
  v_current_status text;
  v_next_stock    int;

  v_result        jsonb := '[]'::jsonb;
  v_item_result   jsonb;
begin
  -- Iterate over each requested item
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_card_id     := (v_item->>'cardId')::uuid;
    v_quantity    := (v_item->>'quantity')::int;
    v_player_name := v_item->>'playerName';
    v_price       := (v_item->>'price')::numeric;

    -- ── Lock + claim exactly v_quantity unsold copies (FIFO) ─────────────
    -- FOR UPDATE SKIP LOCKED means:
    --   • rows already locked by another transaction are skipped entirely
    --   • this transaction gets an exclusive row lock on the rows it selects
    --   • a concurrent call will skip these rows and either find other copies
    --     or find none and raise an exception
    select
      array_agg(cc.id order by cc.created_at asc),
      (array_agg(cc.owner order by cc.created_at asc))[1]
    into v_copy_ids, v_owner
    from (
      select id, owner, created_at
      from card_copies
      where card_id = v_card_id
        and sold = false
      order by created_at asc
      limit v_quantity
      for update skip locked
    ) cc;

    -- Raise if we could not lock enough copies
    if v_copy_ids is null or array_length(v_copy_ids, 1) < v_quantity then
      raise exception 'INSUFFICIENT_STOCK:%', v_player_name
        using errcode = 'P0001';
    end if;

    -- ── Mark copies as sold ───────────────────────────────────────────────
    update card_copies
    set sold = true
    where id = any(v_copy_ids);

    -- ── Update card stock counter ─────────────────────────────────────────
    select stock, status
    into v_current_stock, v_current_status
    from cards
    where id = v_card_id
    for update;  -- lock the card row too

    v_next_stock := greatest(0, v_current_stock - array_length(v_copy_ids, 1));

    update cards
    set
      stock  = v_next_stock,
      status = case when v_next_stock = 0 then 'draft' else v_current_status end
    where id = v_card_id;

    -- ── Accumulate result ─────────────────────────────────────────────────
    v_item_result := jsonb_build_object(
      'cardId',     v_card_id,
      'playerName', v_player_name,
      'quantity',   v_quantity,
      'price',      v_price,
      'owner',      v_owner,
      'copyIds',    to_jsonb(v_copy_ids)
    );

    v_result := v_result || jsonb_build_array(v_item_result);
  end loop;

  return v_result;
end;
$$;

-- Revoke public execute, grant only to service_role
revoke execute on function fulfil_order_items(jsonb) from public;
revoke execute on function fulfil_order_items(jsonb) from anon;
revoke execute on function fulfil_order_items(jsonb) from authenticated;
grant  execute on function fulfil_order_items(jsonb) to service_role;
