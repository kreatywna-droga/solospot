-- WEB FACTOR Platform — Asset Ecosystem Schema (Sprint C8 / Night Shift)
-- Migration 0017: Assets and Media Management Table with Tenant & Store Scoping and RLS

create table if not exists public.assets (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  store_id      uuid not null references public.stores(id) on delete cascade,
  filename      text not null,
  original_name text not null,
  mime_type     text not null,
  size          bigint not null,
  storage_path  text not null unique,
  public_url    text not null,
  type          text not null default 'image',
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indices for performance and tenant filtering
create index if not exists assets_tenant_id_idx on public.assets (tenant_id);
create index if not exists assets_store_id_idx on public.assets (store_id);
create index if not exists assets_type_idx on public.assets (type);
create index if not exists assets_created_at_idx on public.assets (created_at desc);

-- Row Level Security
alter table public.assets enable row level security;

-- Service role full access
create policy "Service role full access to assets" on public.assets
  for all using (auth.role() = 'service_role');

-- Tenant read isolation: Tenants can only view their own assets
create policy "Tenants can view own assets" on public.assets
  for select using (tenant_id in (
    select id from public.tenants where owner_email = auth.jwt()->>'email'
  ));

-- Tenant insert isolation: Tenants can only upload to their own tenant
create policy "Tenants can insert own assets" on public.assets
  for insert with check (tenant_id in (
    select id from public.tenants where owner_email = auth.jwt()->>'email'
  ));

-- Tenant delete isolation: Tenants can only delete their own assets
create policy "Tenants can delete own assets" on public.assets
  for delete using (tenant_id in (
    select id from public.tenants where owner_email = auth.jwt()->>'email'
  ));
