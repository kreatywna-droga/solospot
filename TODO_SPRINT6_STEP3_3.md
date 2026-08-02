# Sprint 6 — Step 3.3 (Persistent Webhook Runtime Integration)

## Checklist
- [x] Implement `src/lib/webhooks/SupabaseIdempotencyStore.ts` with `webhook_events` table contract
  - [x] Unique constraint: `(provider, providerEventId)`
  - [x] Atomic reservation / lock for parallel delivery (RECEIVED/PROCESSING lifecycle)
  - [x] `get`, `upsertReceived`, `markCompleted`, `markFailed`
- [x] Add adapters wiring:
  - [x] `src/lib/webhooks/PaymentEngineAdapter.ts`
  - [x] `src/lib/webhooks/OrderProcessingEngineAdapter.ts`
  - [x] `src/lib/webhooks/AuditWriterAdapter.ts`
  - [x] Mapping `providerTransactionId` -> `paymentIntentId` realizowany w `PaymentEngineAdapter` przez `paymentIntentRepository.findByProviderTransactionId` (dedykowany `PaymentIntentLookupAdapter.ts` opcjonalnie — pominięty)
- [x] Update `src/lib/webhooks/WebhookProcessor.ts` to match payload contract and call adapters
  - [x] Publish `Payment.Completed` with payload `{ orderId, paymentIntentId, tenantId, correlationId }`
- [x] Update webhook route:
  - [x] `src/app/api/webhooks/onekoszyk/route.ts` to use SupabaseIdempotencyStore + real adapters + real `PlatformEventBusImpl`
- [x] Tests (vitest):
  - [x] invalid signature => 401 + zero engine/adapters calls
  - [x] duplicate webhook => 200 ignored
  - [x] payment completed => payment + order confirmed + `Payment.Completed` published + audit written
  - [x] payment failed => payment failure + order NOT confirmed + audit written
  - [x] concurrent duplicate delivery => one PROCESSING, second treated as duplicate
- [x] Verify:
  - [x] `tsc --noEmit`
  - [x] vitest PASS

## Exit criteria
Sprint 6 Step 3.3 COMPLETE

## Next
After completion proceed to Sprint 6 Step 4.

