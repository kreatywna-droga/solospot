-- Schema for observability event timeline:
--
-- Stores audit and trace logs for transactions, tenant provisioning,
-- checkout events, and administrative actions.

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  correlation_id text not null,
  event_type text not null,
  timestamp timestamptz not null default now(),
  actor text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists timeline_events_correlation_idx
  on public.timeline_events (correlation_id);

create index if not exists timeline_events_tenant_timestamp_idx
  on public.timeline_events (tenant_id, timestamp desc);
