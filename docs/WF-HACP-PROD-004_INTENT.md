# TASK WF-HACP-PROD-004 — TASK INTENT & CHARTER

**TASK ID:** WF-HACP-PROD-004  
**PROGRAM:** WEB FACTOR AUTONOMOUS PRODUCT DEVELOPMENT  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**MODE:** FULL AUTONOMOUS CONTROLLED PRODUCTION EXECUTION  
**TYPE:** REAL COMPLEX MULTI-LAYER PRODUCT WORKFLOW — ADVANCED  

---

## 1. MISSION STATEMENT

Build a production-grade capability for reliable order observability across WEB FACTOR. The system must determine, expose, and safely consume the operational state of an order across its real lifecycle (`CREATED` $\rightarrow$ `PAYMENT_PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY_FOR_FULFILLMENT` $\rightarrow$ `FULFILLED` $\rightarrow$ `REFUNDED` / `CANCELLED`).

The implementation must cross **at least 4 genuine architectural layers**:
`LAYER 1 (PERSISTENCE & SSOT) → LAYER 2 (DOMAIN) → LAYER 3 (OBSERVABILITY) → LAYER 4 (API & SECURITY)`

---

## 2. KEY CONSTRAINTS & PRINCIPLES

1. **FOUR-LAYER REQUIREMENT:** The feature must cross 4 real architectural layers with genuine data and control flow:
   `OrderProcessingEngine` ($\text{LAYER 1}$) $\rightarrow$ `OrderLifecycleObservabilityEngine` ($\text{LAYER 2}$) $\rightarrow$ `SystemDiagnosticProbe / MetricsEngine` ($\text{LAYER 3}$) $\rightarrow$ `OrderDiagnosticsApi` ($\text{LAYER 4}$) $\rightarrow$ Validated Order Lifecycle Diagnostic Report + Tenant RLS Compliance ($\text{REAL RESULT}$).
2. **SSOT PRESERVATION:** `OrderProcessingEngine` remains the single authoritative source of order state. No secondary competing state stores allowed.
3. **TENANT ISOLATION & RLS:** Enforce tenant context isolation. Cross-tenant order access must be rejected with HTTP 403 Forbidden without leaking cross-tenant data.
4. **OBSERVABILITY INTEGRATION:** Distinguish `VALID`, `DEGRADED`, `INVALID`, and `OPERATIONAL_FAILURE` states using existing WEB FACTOR observability.
5. **ADVERSARIAL & FAILURE INJECTION:** Test scenarios ADV-01 through ADV-10 and perform controlled failure injection with automatic state recovery.
6. **CONTROLLED TERMINATION:** Following post-commit verification, the run must terminate with a `CONTROLLED STOP`.
