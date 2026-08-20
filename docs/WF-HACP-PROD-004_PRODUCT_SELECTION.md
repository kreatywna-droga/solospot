# TASK WF-HACP-PROD-004 — DISCOVERY & AUTONOMOUS PRODUCT SELECTION

**TASK ID:** WF-HACP-PROD-004  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## 1. DISCOVERY CANDIDATE INVENTORY (5 REAL MULTI-LAYER STRATEGIES)

### Candidate 1: CAND-001 — Order Lifecycle Diagnostic Probe & API Gateway Pipeline (Selected)
- **PHYSICAL FILES:** `packages/commerce-engine/src/OrderLifecycleObservabilityEngine.ts`, `packages/commerce-engine/src/OrderProcessingEngine.ts`, `packages/commerce-engine/src/OrderDiagnosticsApi.ts`, `packages/observability/src/SystemDiagnosticProbe.ts`
- **CURRENT BEHAVIOR:** `OrderProcessingEngine` manages state transitions and emits raw events, but lacks structured lifecycle history tracking, state validity audit, failure recovery, or a tenant-isolated REST API diagnostic endpoint.
- **AFFECTED LAYERS (4 Genuine Layers):**
  1. `LAYER 1 (PERSISTENCE & SSOT)`: `OrderProcessingEngine` (Authoritative state machine & order storage)
  2. `LAYER 2 (DOMAIN & ORCHESTRATION)`: `OrderLifecycleObservabilityEngine` (Transition audit history, state validity, failure recovery)
  3. `LAYER 3 (OBSERVABILITY)`: `packages/observability` (`MetricsEngine` & `HealthCheckEngine` & diagnostic report generator)
  4. `LAYER 4 (API & SECURITY / TENANT CONTEXT)`: `OrderDiagnosticsApi` (Tenant RLS enforcement, HTTP status mapping)
- **USER/PRODUCT VALUE:** Enables operators and tenant store owners to query real-time order status, audit full transition history, detect invalid states, recover from downstream failures, and inspect diagnostic evidence safely per tenant.
- **RISK:** LOW.
- **TESTABILITY:** EXCELLENT.
- **REVERSIBILITY:** HIGH.
- **EXPECTED COMPLEXITY:** ADVANCED.

### Candidate 2: CAND-002 — EventBus Event Store Telemetry Engine
- **PHYSICAL FILES:** `packages/platform-core/src/events/PlatformEventBus.ts`, `packages/observability/src/MetricsEngine.ts`, `packages/commerce-engine/src/OrderProcessingEngine.ts`
- **CURRENT BEHAVIOR:** `PlatformEventBus` broadcasts events asynchronously without persisting an ordered sequence of lifecycle state snapshots per order ID.
- **AFFECTED LAYERS:** 3 Layers (`EVENT BUS` $\rightarrow$ `METRICS` $\rightarrow$ `ORDER PROCESSING`).
- **USER/PRODUCT VALUE:** Provides event-driven metrics, but lacks direct tenant-scoped REST API diagnostics for individual orders.
- **RISK:** MEDIUM.
- **TESTABILITY:** HIGH.

### Candidate 3: CAND-003 — Supabase Order Repository Audit Schema Pipeline
- **PHYSICAL FILES:** `packages/commerce-persistence/src/providers/SupabaseOrderRepository.ts`, `packages/commerce-persistence/src/schema.ts`
- **CURRENT BEHAVIOR:** `SupabaseOrderRepository` handles generic CRUD operations but does not track state transition timelines or diagnostic metadata.
- **AFFECTED LAYERS:** 3 Layers (`DATABASE SCHEMA` $\rightarrow$ `PERSISTENCE` $\rightarrow$ `SECURITY`).
- **USER/PRODUCT VALUE:** Deep database audit history, but lacks domain state machine validation and HTTP API diagnostics.
- **RISK:** HIGH.
- **TESTABILITY:** MEDIUM.

### Candidate 4: CAND-004 — Checkout Flow State Machine Middleware
- **PHYSICAL FILES:** `packages/commerce-engine/src/CheckoutFlow.ts`, `src/lib/security/middleware.ts`
- **CURRENT BEHAVIOR:** `CheckoutFlow` coordinates cart conversion to order, but does not monitor post-checkout lifecycle transitions or fulfillment states.
- **AFFECTED LAYERS:** 3 Layers (`CHECKOUT` $\rightarrow$ `MIDDLEWARE` $\rightarrow$ `CART`).
- **USER/PRODUCT VALUE:** Validates checkout phase, but leaves payment/processing/fulfillment/refund phases unmonitored.
- **RISK:** MEDIUM.
- **TESTABILITY:** HIGH.

### Candidate 5: CAND-005 — System Health Probe Order Metrics Scraper
- **PHYSICAL FILES:** `packages/observability/src/SystemDiagnosticProbe.ts`, `src/app/api/diagnostics/route.ts`
- **CURRENT BEHAVIOR:** Diagnostics API returns global system health summary without granular per-tenant order lifecycle state inspections.
- **AFFECTED LAYERS:** 2 Layers (`OBSERVABILITY` $\rightarrow$ `HEALTH API`).
- **USER/PRODUCT VALUE:** Global status metrics, but lacks order-level state consistency, failure recovery, or tenant isolation.
- **RISK:** LOW.
- **TESTABILITY:** HIGH.

---

## 2. CANDIDATE SELECTION MATRIX

| Candidate ID | Target Feature | Affected Layers | Depth | Product Value | Technical Value | Risk | Testability | Scope Control | Selection Rank |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CAND-001** | Order Lifecycle Observability & API Pipeline | **4 (`SSOT` $\rightarrow$ `DOMAIN` $\rightarrow$ `OBSERVABILITY` $\rightarrow$ `API`)** | **4 Layers** | **HIGH** | **HIGH** | **LOW** | **EXCELLENT** | **STRICT** | **#1 (SELECTED)** |
| **CAND-002** | EventBus Telemetry Engine | 3 (`EVENTS` $\rightarrow$ `METRICS` $\rightarrow$ `ORDER`) | 3 Layers | MEDIUM | HIGH | MEDIUM | HIGH | MEDIUM | #2 |
| **CAND-003** | Supabase Order Audit Schema Pipeline | 3 (`SCHEMA` $\rightarrow$ `PERSISTENCE` $\rightarrow$ `SECURITY`) | 3 Layers | MEDIUM | MEDIUM | HIGH | MEDIUM | MEDIUM | #3 |
| **CAND-004** | Checkout Flow Middleware | 3 (`CHECKOUT` $\rightarrow$ `MIDDLEWARE` $\rightarrow$ `CART`) | 3 Layers | MEDIUM | MEDIUM | MEDIUM | HIGH | SMALL | #4 |
| **CAND-005** | Health Probe Metrics Scraper | 2 (`OBSERVABILITY` $\rightarrow$ `HEALTH API`) | 2 Layers | LOW | LOW | LOW | HIGH | SMALL | #5 |

---

## 3. AUTONOMOUS SELECTION DECISION

**SELECTED CANDIDATE:** `CAND-001` — Order Lifecycle Diagnostic Probe & API Gateway Pipeline  

**REASON FOR SELECTION:**
1. Satisfies mandatory **FOUR-LAYER REQUIREMENT**: `OrderProcessingEngine` ($\text{PERSISTENCE/SSOT}$) $\rightarrow$ `OrderLifecycleObservabilityEngine` ($\text{DOMAIN}$) $\rightarrow$ `SystemDiagnosticProbe / MetricsEngine` ($\text{OBSERVABILITY}$) $\rightarrow$ `OrderDiagnosticsApi` ($\text{API & SECURITY}$).
2. Preserves single Authoritative Source of Truth (SSOT) in `OrderProcessingEngine`.
3. Delivers high real production value: real-time order lifecycle tracking, transition audit logging, invalid state detection, failure recovery, and tenant RLS isolation.
