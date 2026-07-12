-- Add image URL columns to cards table for front/back scans
alter table public.cards add column if not exists image_front text;
alter table public.cards add column if not exists image_back text;
