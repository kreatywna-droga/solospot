# TODO (BlackboxAI) — Sprint 6 Step 3.3

## Step 1 — Atomic idempotency (SUPABASE)
- [ ] Implement RECEIVED→PROCESSING lifecycle atomically in `SupabaseIdempotencyStore.upsertReceived`
- [ ] Ensure concurrent delivery: 2nd request becomes duplicate/in-progress and webhook is ignored
- [ ] Update `WebhookProcessor` duplicate logic to also treat PROCESSING as non-terminal (if required)

## Step 2 — PaymentEngineAdapter (no placeholders)
- [ ] Inspect `packages/commerce-engine` payment domain interfaces and constructors
- [ ] Implement `PaymentEngineAdapter.capture()` by calling real `PaymentEngine.completePayment()` / `failPayment()`
- [ ] Determine deterministic mapping providerTransactionId → paymentIntentId from existing persistent sources (or add minimal persistent contract if missing)

## Step 3 — OrderProcessingEngineAdapter
- [ ] Implement `OrderProcessingEngineAdapter.confirmPayment()` by calling real `OrderProcessingEngine.confirmPayment()`
- [ ] Ensure for PAYMENT_FAILED no confirm/order publish occurs

## Step 4 — EventBus + Mission Control Audit
- [ ] Implement `AuditWriterAdapter.record()` to emit `Security.AuditEntry` via `PlatformEventBusImpl` / MissionControlRuntime
- [ ] Wire bus/event types so Mission Control timeline receives audit events

## Step 5 — Route wiring
- [ ] Implement `src/app/api/webhooks/onekoszyk/route.ts` with real adapter instances and real dep wiring
- [ ] Route should only verify + call `WebhookProcessor.process()`

## Step 6 — Verification
- [ ] Add/adjust tests to validate end-to-end execution path and concurrency semantics
- [ ] Smoke-test runtime build for `/api/webhooks/onekoszyk` handler

