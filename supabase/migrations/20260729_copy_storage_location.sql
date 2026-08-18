-- Add storage_location to card_copies
ALTER TABLE card_copies ADD COLUMN IF NOT EXISTS storage_location text;

-- Migrate existing storage_location from cards down to all their copies
UPDATE card_copies cc
SET storage_location = c.storage_location
FROM cards c
WHERE cc.card_id = c.id
AND c.storage_location IS NOT NULL
AND cc.storage_location IS NULL;
