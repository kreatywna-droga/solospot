# Sprint 6 — Step 3.3 (Persistent Webhook Runtime Integration)

## Checklist
- [ ] Implement `src/lib/webhooks/SupabaseIdempotencyStore.ts` with `webhook_events` table contract
  - [ ] Unique constraint: `(provider, providerEventId)`
  - [ ] Atomic reservation / lock for parallel delivery (RECEIVED/PROCESSING lifecycle)
  - [ ] `get`, `upsertReceived`, `markCompleted`, `markFailed`
- [ ] Add adapters wiring:
  - [ ] `src/lib/webhooks/PaymentEngineAdapter.ts`
  - [ ] `src/lib/webhooks/OrderProcessingEngineAdapter.ts`
  - [ ] `src/lib/webhooks/AuditWriterAdapter.ts`
  - [ ] (Optional) `src/lib/webhooks/PaymentIntentLookupAdapter.ts` for deterministic mapping via `providerTransactionId` -> `paymentIntentId`
- [ ] Update `src/lib/webhooks/WebhookProcessor.ts` to match payload contract and call adapters
  - [ ] Publish `Payment.Completed` with payload `{ orderId, paymentIntentId, tenantId, correlationId }`
- [ ] Update webhook route:
  - [ ] `src/app/api/webhooks/onekoszyk/route.ts` to use SupabaseIdempotencyStore + real adapters + real `PlatformEventBusImpl`
- [ ] Tests (vitest):
  - [ ] invalid signature => 401 + zero engine/adapters calls
  - [ ] duplicate webhook => 200 ignored
  - [ ] payment completed => payment + order confirmed + `Payment.Completed` published + audit written
  - [ ] payment failed => payment failure + order NOT confirmed + audit written
  - [ ] concurrent duplicate delivery => one PROCESSING, second treated as duplicate
- [ ] Verify:
  - [ ] `tsc --noEmit`
  - [ ] vitest PASS

## Exit criteria
Sprint 6 Step 3.3 COMPLETE

## Next
After completion proceed to Sprint 6 Step 4.

