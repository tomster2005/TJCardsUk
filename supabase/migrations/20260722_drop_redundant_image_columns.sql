-- Backfill any data from redundant columns before dropping them
update public.cards
set image_url = image_front
where image_url is null and image_front is not null;

update public.cards
set back_image_url = image_back
where back_image_url is null and image_back is not null;

-- Drop redundant columns (image_url and back_image_url are canonical)
alter table public.cards drop column if exists image_front;
alter table public.cards drop column if exists image_back;
