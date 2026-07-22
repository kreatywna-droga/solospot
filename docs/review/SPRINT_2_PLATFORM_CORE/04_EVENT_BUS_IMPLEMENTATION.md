---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_2_PLATFORM_CORE/03_ERROR_ENGINE_IMPLEMENTATION.md
---

# SPRINT 2: PLATFORM CORE IMPLEMENTATION
## Zadanie 4 — Platform Event Bus Implementation
*Dokumentacja techniczna oraz specyfikacja implementacyjna asynchronicznej szyny zdarzeń (Platform Event Bus) z izolacją awarii i tenantów w paczce `packages/platform-core`.*

---

### 1. Model Dystrybucji i Typy (API Structure)

Szyna zdarzeń została zaimplementowana w katalogu `packages/platform-core/src/events/` i składa się z następujących elementów:

* **`PlatformEvent.ts`**: Definicja interfejsu `PlatformEvent<T>` wraz ze schematem walidacji Zod `PlatformEventSchema` (sprawdzanie poprawności pól `eventId`, `eventType`, `timestamp`, `correlationId` w runtime).
* **`EventRegistry.ts`**: Rejestr typów zdarzeń, w tym:
  * `Runtime.RequestStarted` / `Runtime.RequestCompleted`
  * `Tenant.Resolved` / `Tenant.ResolutionFailed`
  * `Provisioning.Started` / `Provisioning.Completed` / `Provisioning.Failed`
  * `Package.Loaded` / `Package.Failed`
  * `System.LogCreated` / `System.ErrorOccurred`
* **`PlatformEventBus.ts`**: Implementacja `PlatformEventBusImpl` ze wsparciem dla Pub-Sub, asynchronicznego dispatchowania oraz izolacji.

---

### 2. Kluczowe Funkcjonalności Architektoniczne

#### 2.1 Asynchroniczne dispatchowanie z izolacją awarii (Fault Isolation)
Wywołanie `publish(event)` automatycznie identyfikuje wszystkich zarejestrowanych subskrybentów (oraz subskrypcje typu wildcard `*`) i uruchamia ich handlery asynchronicznie za pomocą `Promise.allSettled()`.
* **Izolacja:** Awaria jednego handlera (rzucenie wyjątku lub odrzucenie obietnicy) nie przerywa przetwarzania u pozostałych subskrybentów.
* **Propagacja błędu:** Każdy błąd w handlerze jest logowany za pomocą `PlatformLogger`, a także generuje i wysyła na szynę systemowe zdarzenie `System.ErrorOccurred` w celu poinformowania modułów telemetrii.

#### 2.2 Izolacja Tenantów (Tenant Isolation)
Subskrybenci mogą podczas rejestracji opcjonalnie podać identyfikator tenanta (`tenantId`):
```typescript
eventBus.subscribe('Test.Created', handler, 'tenant_A');
```
Podczas dystrybucji zdarzenia szyna automatycznie sprawdza, czy `tenantId` subskrybenta jest zgodny z `tenantId` zdarzenia. W przypadku niezgodności zdarzenie jest pomijane dla danego handlera, co gwarantuje pełne bezpieczeństwo danych między sklepami.

---

### 3. Zestaw Testów Jednostkowych

Plik testów `packages/platform-core/src/events/event-bus.test.ts` weryfikuje pełne spektrum zachowań szyny zdarzeń:

1. **Pub-Sub Flow (`publish`/`subscribe`/`unsubscribe`)**: Potwierdza poprawne dostarczanie wiadomości oraz usuwanie subskrypcji.
2. **Correlation Propagation**: Weryfikuje zachowanie ciągłości identyfikatorów `correlationId` i `causationId` przy łańcuchowym wyzwalaniu zdarzeń.
3. **Tenant Isolation**: Sprawdza, czy handlery przypisane do danego tenanta nie reagują na zdarzenia innego tenanta.
4. **Fault Isolation**: Gwarantuje odporność szyny na awarie pojedynczych odbiorców.
