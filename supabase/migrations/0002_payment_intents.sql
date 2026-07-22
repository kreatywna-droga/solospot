-- Minimal persistence for webhook/runtime mapping:
-- OneKoszyk providerTransactionId -> domain PaymentIntent (identified by id)
--
-- This schema is intentionally small and provider-agnostic.
-- It supports the PaymentEngineAdapter lookup path.

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null,

  provider text not null,
  provider_transaction_id text not null,

  -- OrderProcessingEngine expects orderId to be the same string as
  -- PaymentProviderEvent.orderId (see WebhookVerifier + WebhookProcessor).
  order_id text,

  status text not null default 'CREATED',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payment_intents_tenant_provider_txn_unique unique (
    tenant_id,
    provider,
    provider_transaction_id
  )
);

create index if not exists payment_intents_lookup_idx
  on public.payment_intents (tenant_id, provider, provider_transaction_id);

create index if not exists payment_intents_order_id_idx
  on public.payment_intents (order_id);

-- Best-effort updated_at trigger (safe to ignore if trigger functions are not present).
-- If gen_random_uuid() is not available, add pgcrypto extension.


