# TASK WF-HACP-PROD-004 — IMPLEMENTATION & VERIFICATION PLAN

**TASK ID:** WF-HACP-PROD-004  
**FEATURE:** Order Lifecycle Diagnostic Probe & API Gateway Pipeline  
**SELECTED CANDIDATE:** CAND-001  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## 1. OBJECTIVE & SCOPE

### Objective
Create `OrderLifecycleObservabilityEngine` and `OrderDiagnosticsApi` in `packages/commerce-engine` to orchestrate order lifecycle observability across **4 distinct architectural layers**:
1. **Layer 1 (`PERSISTENCE / SSOT`):** `OrderProcessingEngine` (`packages/commerce-engine/src/OrderProcessingEngine.ts`) — Authoritative state owner & transition rule engine.
2. **Layer 2 (`DOMAIN & ORCHESTRATION`):** `OrderLifecycleObservabilityEngine` (`packages/commerce-engine/src/OrderLifecycleObservabilityEngine.ts`) — Transition audit log, state consistency validator, operational failure recovery (`recoverOrderState`).
3. **Layer 3 (`OBSERVABILITY`):** Integration with `packages/observability` (`MetricsEngine` & `HealthCheckEngine`) — Operational metrics recording & state status calculation (`VALID`, `DEGRADED`, `INVALID`, `OPERATIONAL_FAILURE`).
4. **Layer 4 (`API & SECURITY`):** `OrderDiagnosticsApi` (`packages/commerce-engine/src/OrderDiagnosticsApi.ts`) — Tenant RLS security enforcement, cross-tenant access rejection, HTTP response mapping (200 OK, 403 Forbidden, 404 Not Found, 503 Service Unavailable).

### In-Scope Files
1. `packages/commerce-engine/src/OrderLifecycleObservabilityEngine.ts` (NEW: Domain & Orchestration Layer)
2. `packages/commerce-engine/src/OrderDiagnosticsApi.ts` (NEW: API & Tenant Security Layer)
3. `packages/commerce-engine/src/index.ts` (Export new engines and interfaces)
4. `packages/commerce-engine/src/order-observability.test.ts` (NEW: Feature, E2E vertical slice, adversarial ADV-01..ADV-10, failure injection & rollback tests)

---

## 2. DEPENDENCIES & RUNTIME

- **Runtime:** Node.js / Bun (`bun test`)
- **Package Dependencies:** `packages/commerce-engine`, `packages/observability`, `packages/platform-core`

---

## 3. IMPLEMENTATION STEPS

1. **Step 1 (`packages/commerce-engine/src/OrderLifecycleObservabilityEngine.ts`):**
   - Create `OrderLifecycleObservabilityEngine` subscribing to `Order.Created`, `Order.PaymentConfirmed`, `Order.ProcessingStarted`, `Order.Fulfilled`, `Order.Cancelled`, `Order.Refunded` via `PlatformEventBusImpl`.
   - Record timestamped `OrderTransitionRecord` history per order ID.
   - Implement `getLifecycleAudit(tenantId, orderId)` returning transition history and validating timeline sequence integrity.
   - Implement `recoverOrderState(tenantId, orderId, targetStatus, reason)` to safely restore consistent state during operational failures.
2. **Step 2 (`packages/commerce-engine/src/OrderDiagnosticsApi.ts`):**
   - Create `OrderDiagnosticsApi` combining `OrderProcessingEngine` and `OrderLifecycleObservabilityEngine`.
   - Implement `getDiagnostics(tenantId, orderId)`:
     - Enforce tenant isolation RLS (`enforceTenantIsolation`).
     - Calculate order health status:
       - `VALID`: Valid state transition sequence and current status match SSOT.
       - `DEGRADED`: Valid current status but contains minor warning (e.g. slow payment or long processing duration).
       - `INVALID`: Invalid state transition attempt detected in log history.
       - `OPERATIONAL_FAILURE`: State machine out of sync or downstream failure.
     - Return structured `OrderDiagnosticResponse` with HTTP status code.
3. **Step 3 (`packages/commerce-engine/src/index.ts`):**
   - Export `OrderLifecycleObservabilityEngine` and `OrderDiagnosticsApi`.
4. **Step 4 (`packages/commerce-engine/src/order-observability.test.ts`):**
   - Write comprehensive tests covering 10 feature scenarios, 5 E2E vertical slices, 10 adversarial scenarios (ADV-01..ADV-10), and failure injection with automatic state recovery.

---

## 4. TESTING & REGRESSION STRATEGY

- **Deterministic Testing:** Run `bun test packages/commerce-engine packages/commerce-persistence packages/tenant-admin packages/security packages/platform-core/src/tenant`.
- **Adversarial Scenarios (ADV-01..ADV-10):** Test invalid transitions, repeated actions, concurrent actions, stale state, partial failure, cross-tenant access, malformed order data, unknown orders, diagnostic mismatches, and post-failure recovery.
- **Failure Injection & Rollback:** Simulate downstream processing crash during `PAID` $\rightarrow$ `PROCESSING` transition and verify automatic failure detection, safe state recovery, and clean diagnostic report.
- **Target:** 100% test pass rate, `PASS_TO_FAIL = 0`.
