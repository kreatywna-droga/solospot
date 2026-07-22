-- WEB FACTOR Platform — Initial Schema
-- Tworzy bazowe tabele platformy SaaS: tenants i stores.
-- Wymagana jako pierwsza migracja przed 0002-0004.

-- Extension: pgcrypto (wymagana przez gen_random_uuid() na starszych Supabase)
-- Na Supabase Production jest już aktywna domyślnie. Dodana dla pewności.
create extension if not exists "pgcrypto";

-- Tabela tenantów (dzierżawców) platformy
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  owner_email   text not null,
  package_id    text not null default 'standard',
  status        text not null default 'PENDING',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint tenants_owner_email_unique unique (owner_email)
);

create index if not exists tenants_status_idx
  on public.tenants (status);

create index if not exists tenants_owner_email_idx
  on public.tenants (owner_email);

-- Tabela sklepów powiązanych z tenantami
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  domain      text,
  status      text not null default 'PENDING',
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint stores_tenant_unique unique (tenant_id)
);

create index if not exists stores_tenant_id_idx
  on public.stores (tenant_id);

create index if not exists stores_domain_idx
  on public.stores (domain)
  where domain is not null;

-- Row Level Security
alter table public.tenants enable row level security;
alter table public.stores enable row level security;

-- Polityki RLS: tenants
create policy "Service role full access to tenants" on public.tenants
  for all using (auth.role() = 'service_role');

-- Polityki RLS: stores
create policy "Service role full access to stores" on public.stores
  for all using (auth.role() = 'service_role');
