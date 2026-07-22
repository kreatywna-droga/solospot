---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_2_PLATFORM_CORE/01_PLATFORM_CORE_IMPLEMENTATION.md
---

# SPRINT 2: PLATFORM CORE IMPLEMENTATION
## Zadanie 2 — Platform Logger Implementation
*Dokumentacja techniczna oraz specyfikacja implementacyjna zintegrowanego telemetrycznie modułu Platform Logger w paczce `packages/platform-core`.*

---

### 1. Interfejs Rejestratora (Logger Interface)

Logger implementuje interfejs `PlatformLogger` zdefiniowany w typach współdzielonych platformy (`packages/platform-core/src/types/index.ts`):

```typescript
export interface LogContext {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly module?: string;
  readonly eventType?: string;
}

export interface LoggerPayload {
  readonly message: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly module?: string;
  readonly eventType?: string;
  readonly metadata?: Record<string, any>;
}

export interface PlatformLogger {
  info(payload: LoggerPayload): void;
  warn(payload: LoggerPayload): void;
  error(payload: LoggerPayload & { readonly error?: Error }): void;
  fatal(payload: LoggerPayload & { readonly error?: Error }): void;
  setEventBus(eventBus: any): void;
}
```

---

### 2. Format Telemetryczny JSON

Format wyjściowy JSON jest ustrukturyzowany i ujednolicony pod kątem integracji z zewnętrznymi aggregatorami (np. Datadog, AWS CloudWatch, Supabase Logs).

Logi poziomów `INFO` i `WARN` są kierowane na strumień standardowego wyjścia (`stdout` -> `console.log` / `console.warn`), natomiast poziomy `ERROR` i `FATAL` na strumień standardowego wyjścia błędów (`stderr` -> `console.error`).

---

### 3. Zapobieganie Pętlom Zwrotnym (Telemetry Loop Protection)

Logger posiada wbudowaną integrację z szyną zdarzeń (`PlatformEventBus`) i po każdym zapisaniu logu emituje asynchronicznie zdarzenie `System.LogCreated`. Aby uniknąć nieskończonej pętli logowania (gdzie operacja publikacji logu generuje kolejny log o publikacji), zastosowano dwie bariery ochronne:

1. **Reentrancy Guard:** Flaga logiczna `isPublishing` zapobiega wywołaniom zagnieżdżonym w tym samym wątku wykonania.
2. **Event Type Filter:** Ignorowanie zdarzeń o typie `System.LogCreated` na poziomie parsera zdarzeń telemetrycznych loggera.

---

### 4. Kod Testowy (logger.test.ts)

Poprawność działania została udokumentowana i zweryfikowana w pliku testów `packages/platform-core/src/logger/logger.test.ts` przy użyciu frameworka Vitest:
* Weryfikacja formatu JSON.
* Potwierdzenie separacji strumieni wyjściowych.
* Weryfikacja asynchronicznej emisji zdarzeń telemetrycznych.
* Test braku wycieków i poprawnego mapowania ID tenantów.
