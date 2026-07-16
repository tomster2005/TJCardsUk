-- Add variant_group_id to cards so variants of the same card share a group.
-- The base card (parallel IS NULL or 'Base') is the one shown in the catalogue.
-- All variants (refractor, prizm, etc.) share the same variant_group_id as the base.

ALTER TABLE cards ADD COLUMN IF NOT EXISTS variant_group_id uuid DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_base_variant boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_cards_variant_group ON cards (variant_group_id);
