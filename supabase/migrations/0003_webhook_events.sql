-- Schema for webhook idempotency tracking:
--
-- Supports SupabaseIdempotencyStore and provides unique event key constraints
-- to guarantee at-most-once processing.

create table if not exists public.webhook_events (
  provider text not null,
  provider_event_id text not null,
  payload_hash text not null,
  correlation_id text not null,
  tenant_id uuid not null,
  status text not null default 'RECEIVED',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,

  constraint webhook_events_pk primary key (
    provider,
    provider_event_id,
    payload_hash
  )
);

create index if not exists webhook_events_lookup_idx
  on public.webhook_events (provider, provider_event_id, payload_hash);

create index if not exists webhook_events_tenant_idx
  on public.webhook_events (tenant_id);
