-- WEB FACTOR Platform — Add slug column to stores table
-- Wymagana po 0004_timeline_events.sql

alter table if exists public.stores
  add column if not exists slug text not null default '';

create index if not exists stores_slug_idx
  on public.stores (slug)
  where slug is not null;
