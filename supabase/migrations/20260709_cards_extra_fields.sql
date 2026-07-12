-- Add missing card fields for filtering and display
-- Run this in the Supabase SQL Editor.

-- Image columns that match what the catalogue/frontend expects
alter table public.cards add column if not exists image_url text;
alter table public.cards add column if not exists back_image_url text;

-- Card metadata fields
alter table public.cards add column if not exists team text;
alter table public.cards add column if not exists brand text;
alter table public.cards add column if not exists season text;
alter table public.cards add column if not exists parallel text;
alter table public.cards add column if not exists rarity text;
alter table public.cards add column if not exists print_run text;

-- Backfill: copy image_front/image_back into image_url/back_image_url for existing cards
update public.cards set image_url = image_front where image_front is not null and image_url is null;
update public.cards set back_image_url = image_back where image_back is not null and back_image_url is null;
