---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/02_PAYMENT_ENGINE.md
- docs/review/SPRINT_4_COMMERCE_RUNTIME/03_ORDER_PROCESSING_ENGINE.md
---

# SPRINT 6: OPERATIONAL READINESS
## Specyfikacja Kontraktu — 01_WEBHOOK_INTEGRATION.md
*Definicja infrastruktury webhooków bramki 1Koszyk, systemu idempotencji Supabase, adapterów Payment i Order Engine oraz potoku audytowego.*

> **Zasada nadrzędna:** Webhooki muszą być idempotentne na poziomie bazy danych i odporne na współbieżne dostarczenie.
> Każde zdarzenie musi przejść walidację podpisu, a jego wykonanie jest logowane do osi czasu audytu.

---

### 1. Webhook Runtime Architecture

```
1koszyk Webhook Delivery → POST /api/webhooks/onekoszyk
                                  |
                                  ↓
                           WebhookVerifier
                         (HMAC SHA256 Signature)
                                  |
                                  ↓
                           WebhookProcessor
                                  |
            +---------------------+---------------------+
            |                                           |
            ↓                                           ↓
 SupabaseIdempotencyStore (DB)                 PaymentEngineAdapter
(Atomic Lock status=PROCESSING)             (completePayment / failPayment)
            |                                           |
            +---------------------+---------------------+
                                  |
                                  ↓
                       OrderProcessingEngineAdapter
                       (confirmPayment if COMPLETED)
                                  |
                                  ↓
                        PlatformEventBus (Event)
                                  |
                                  ↓
                         AuditWriterAdapter
                    (Audit Log to Mission Control)
```

---

### 2. Idempotency Lifecycle & DB Layout

Szyna idempotencji opiera się na tabeli `webhook_events` o następującym schemacie:

| Kolumna | Typ | Opis |
|---|---|---|
| `provider` | `text` | Nazwa dostawcy (np. `'onekoszyk'`) |
| `provider_event_id` | `text` | Unikalny identyfikator zdarzenia u dostawcy (np. `event_id`) |
| `payload_hash` | `text` | Skrót SHA-256 z raw body payloadu |
| `correlation_id` | `text` | Identyfikator korelacji zdarzenia |
| `tenant_id` | `text` | Identyfikator dzierżawcy (UUID) |
| `status` | `text` | Stan procesowania (`RECEIVED` \| `PROCESSING` \| `COMPLETED` \| `FAILED`) |
| `received_at` | `timestamp` | Czas odebrania |
| `processed_at` | `timestamp` | Czas zakończenia przetwarzania |
| `error` | `text` | Komunikat błędu w przypadku stanu `FAILED` |

#### Unikalny Indeks (Unique Constraint):
- Unikalność jest wymuszana na trójce: `(provider, provider_event_id, payload_hash)`.

#### Cykl Życia Statusów:
1. `insert(...)` status `PROCESSING`.
2. Jeśli insert się powiedzie (brak duplikacji), system przystępuje do wykonywania logiki biznesowej.
3. Po zakończeniu status zmienia się na `COMPLETED`.
4. W przypadku błędu status zmienia się na `FAILED`.
5. Jeśli insert rzuci błąd `23505` (Unique Constraint), system próbuje zaktualizować status na `PROCESSING` z warunkiem, że obecny status to `RECEIVED` lub `FAILED` (blokada przed ponownym procesowaniem w stanie `PROCESSING` lub `COMPLETED`).

---

### 3. Verification & Engine Integration

#### Signature Validation (HMAC SHA-256):
- Sygnatura przekazywana jest w nagłówku `x-signature`.
- Wyliczana jako `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`.

#### Engine Coordination:
- **Płatność zakończona sukcesem (`PAYMENT_COMPLETED`):**
  - Wywołanie `PaymentEngine.completePayment`.
  - Publikacja zdarzenia `Payment.Completed` na szynie `PlatformEventBus`.
  - Wywołanie `OrderProcessingEngine.confirmPayment`.
- **Płatność nieudana (`PAYMENT_FAILED`):**
  - Wywołanie `PaymentEngine.failPayment`.
  - Brak potwierdzenia zamówienia (order status pozostaje bez zmian).

---

### 4. Quality Gates & Verification Report

#### 1. TypeScript Gate
- Komenda: `npx tsc --noEmit`
- Status: **PASSED (Exit Code 0)**

#### 2. Vitest Webhook Runtime Test Gate
- Komenda: `npx vitest run src/lib/webhooks/webhook-runtime.test.ts`
- Status: **PASSED (5/5 tests passed)**

| Scenariusz Testowy | Oczekiwane Zachowanie | Wynik |
|---|---|---|
| **Invalid signature** | Zwraca status `401`, brak zapisów w bazie danych, brak wywołań silników. | ✅ PASSED |
| **Duplicate delivery** | Zwraca status `200` z `{ ignored: true }`, brak ponownego wykonania silników. | ✅ PASSED |
| **Payment completed** | Zwraca status `200` z `{ success: true }`, wywołuje `completePayment` i `confirmPayment`, status bazy `COMPLETED`. | ✅ PASSED |
| **Payment failed** | Zwraca status `200`, wywołuje `failPayment`, nie wywołuje `confirmPayment`, status bazy `COMPLETED`. | ✅ PASSED |
| **Concurrent atomic locking** | Dwa współbieżne wywołania: jedno kończy się sukcesem, drugie zostaje zignorowane. Silniki wywołane tylko raz. | ✅ PASSED |
