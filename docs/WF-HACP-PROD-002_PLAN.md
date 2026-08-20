# TASK WF-HACP-PROD-002 — IMPLEMENTATION & VERIFICATION PLAN

**TASK ID:** WF-HACP-PROD-002  
**FEATURE:** Domain-to-API Health Summary & System Diagnostics Pipeline  
**SELECTED CANDIDATE:** CAND-001  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## 1. OBJECTIVE & SCOPE

### Objective
Integrate the domain health summary calculation (`HealthCheckEngine.getOverallStatus()`) into `SystemDiagnosticProbe` and the public Next.js API endpoint `/api/diagnostics` (`src/app/api/diagnostics/route.ts`), exposing structured health summary metrics (`healthyCount`, `degradedCount`, `unhealthyCount`, `totalChecks`) in the API JSON response and enforcing proper HTTP status code translation (503 for unhealthy, 200 for healthy/degraded).

### In-Scope Files
1. `packages/observability/src/SystemDiagnosticProbe.ts` (Extend `SystemDiagnosticReport` interface with `summary?: SystemHealthSummary` and populate it inside `runDiagnostics()`)
2. `src/app/api/diagnostics/route.ts` (Update `createDiagnosticsReport()` and `GET()` handler to expose `summary` and translate HTTP status code)
3. `src/app/api/diagnostics/diagnostics.test.ts` (Add unit and API integration tests for report summary, status codes, and edge cases)

### Non-Goals
- Do not modify other API endpoints in `src/app/api/`.
- Do not alter existing `HealthCheckEngine` status calculation logic.

---

## 2. DEPENDENCIES & RUNTIME

- **Runtime:** Node.js / Bun (`bun test`)
- **Package Dependencies:** `packages/observability`
- **Framework:** Next.js App Router API Route (`Response.json`)

---

## 3. IMPLEMENTATION STEPS

1. **Step 1 (`packages/observability/src/SystemDiagnosticProbe.ts`):**
   - Import `SystemHealthSummary` from `./ObservabilityDomain`.
   - Add `summary?: SystemHealthSummary;` to `SystemDiagnosticReport`.
   - In `runDiagnostics()`, call `const summary = await this.healthEngine.getOverallStatus();` and include `summary` in the returned object.
2. **Step 2 (`src/app/api/diagnostics/route.ts`):**
   - Ensure `createDiagnosticsReport()` returns the report containing `summary`.
   - Update `GET()` to verify `report.status === 'unhealthy' || report.summary?.status === 'unhealthy'`, setting HTTP status code to 503 if true, otherwise 200.
3. **Step 3 (`src/app/api/diagnostics/diagnostics.test.ts`):**
   - Update test suite to verify presence of `summary` in `createDiagnosticsReport()`.
   - Add test case for HTTP status 503 when a probe check fails.
   - Add test case verifying count metrics (`healthyCount`, `degradedCount`, `unhealthyCount`, `totalChecks`).

---

## 4. TESTING & REGRESSION STRATEGY

- **Deterministic Testing:** Run `bun test packages/observability src/app/api/diagnostics`.
- **Adversarial Testing:** Test simulated check failure, empty check list, and thrown exceptions in probe checks.
- **Regression Suite:** Run `bun test packages/reliability packages/design-tokens packages/security packages/tenant-admin`.
- **Target:** 100% test pass rate, `PASS_TO_FAIL = 0`.
