# TASK WF-HACP-PROD-002 — ARCHITECTURE DECISION RECORD (ADR)

**TASK ID:** WF-HACP-PROD-002  
**TITLE:** Domain-to-API Health Summary & System Diagnostics Pipeline  
**STATUS:** APPROVED  
**DECISION MAKER:** Architect Worker (`opencode/claude-3-5-sonnet`)  
**DATE:** 2026-08-20  

---

## 1. CONTEXT & ARCHITECTURAL REQUIREMENT

`WF-HACP-PROD-001` added `HealthCheckEngine.getOverallStatus()` in `packages/observability`. However, web clients and monitoring infrastructure query the Next.js HTTP API route `/api/diagnostics`. Currently, `SystemDiagnosticProbe` generates system resource metrics (memory, event loop latency, environment), but does not incorporate the aggregated `SystemHealthSummary` domain payload.

To satisfy the **2-layer complexity requirement** (`DOMAIN` $\rightarrow$ `API`) without modifying platform architecture boundaries, we extend `SystemDiagnosticReport` to embed `summary: SystemHealthSummary` and expose it via the `/api/diagnostics` HTTP GET endpoint.

---

## 2. DECISION LOG & INVARIANTS

1. **Layer Integration:** `HealthCheckEngine` ($\text{DOMAIN}$) $\rightarrow$ `SystemDiagnosticProbe` ($\text{PROBE}$) $\rightarrow$ `src/app/api/diagnostics/route.ts` ($\text{API}$).
2. **HTTP Status Code Mapping:**
   - If `status === 'unhealthy'` OR `summary.status === 'unhealthy'` $\rightarrow$ **HTTP 503 Service Unavailable**.
   - If `status === 'degraded'` OR `summary.status === 'degraded'` $\rightarrow$ **HTTP 200 OK** (with degraded count indicators).
   - If all healthy $\rightarrow$ **HTTP 200 OK**.
3. **Single Source of Truth (SSOT):** `HealthCheckEngine` remains the SSOT for check aggregation and health state calculation.
4. **Boundary Isolation:** Changes are restricted strictly to `packages/observability` and `src/app/api/diagnostics/`. Zero modifications to other monorepo packages.

---

## 3. ARCHITECTURAL COMPLIANCE VERDICT

- **COMPLIANT:** YES
- **RISK:** LOW
- **REVERSIBILITY:** HIGH
