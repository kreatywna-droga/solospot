import type { IdempotencyStore } from './IdempotencyStore';

// Placeholder contract for persistent idempotency.
// W Sprint 6 Step 3.2 przestawiamy InMemory → persistent adapter.
// Konkretna implementacja (Supabase/Postgres) zostanie dodana w Step 4.
export interface WebhookEventRepository extends IdempotencyStore {
  // identyczny kontrakt, ale osobny typ na czytelność domenową
}

