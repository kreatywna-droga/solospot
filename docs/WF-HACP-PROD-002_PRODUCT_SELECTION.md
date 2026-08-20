# TASK WF-HACP-PROD-002 — DISCOVERY & AUTONOMOUS PRODUCT SELECTION

**TASK ID:** WF-HACP-PROD-002  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## 1. DISCOVERY CANDIDATE INVENTORY (MINIMUM 5 REAL CANDIDATES)

### Candidate 1: CAND-001 — Domain-to-API Health Summary & System Diagnostics Pipeline
- **LOCATION:** `packages/observability` $\leftrightarrow$ `src/app/api/diagnostics/route.ts`
- **PROBLEM:** `HealthCheckEngine.getOverallStatus()` (implemented in `WF-HACP-PROD-001`) provides aggregated `SystemHealthSummary` state, but the HTTP API route `/api/diagnostics` only executes raw probe checks and does not expose `summary: SystemHealthSummary` in the REST API payload or handle degraded HTTP response semantics.
- **USER_VALUE:** Operational monitoring tools and system dashboards receive structured health metrics (`healthyCount`, `degradedCount`, `unhealthyCount`, `totalChecks`) in the standard `/api/diagnostics` HTTP endpoint.
- **TECHNICAL_VALUE:** Integrates `DOMAIN` (`HealthCheckEngine.getOverallStatus()`) $\rightarrow$ `API` (`src/app/api/diagnostics/route.ts`), bridging domain aggregation directly to the web API layer with complete type safety.
- **AFFECTED_LAYERS:** 2 Layers (`DOMAIN` $\rightarrow$ `API`)
- **RISK:** LOW. Isolated to observability domain and API diagnostics route.
- **TESTABILITY:** HIGH (Unit & API Integration tests with `bun test`).
- **REVERSIBILITY:** HIGH.
- **ESTIMATED_SCOPE:** 3 files (`packages/observability/src/SystemDiagnosticProbe.ts`, `src/app/api/diagnostics/route.ts`, `src/app/api/diagnostics/diagnostics.test.ts`).

### Candidate 2: CAND-002 — Tenant Security Event Aggregation & Audit Bridge
- **LOCATION:** `packages/security` $\leftrightarrow$ `packages/tenant-admin`
- **PROBLEM:** `SecurityEngine` logs rate limit violations, but does not correlate security breaches with `TenantContextBuilder` to produce tenant-scoped security risk metrics.
- **USER_VALUE:** Organization administrators receive tenant-isolated security alerts.
- **TECHNICAL_VALUE:** Bridges security intelligence to tenant context administration.
- **AFFECTED_LAYERS:** 2 Layers (`SECURITY DOMAIN` $\rightarrow$ `TENANT ADMIN API`)
- **RISK:** MEDIUM.
- **TESTABILITY:** HIGH.
- **REVERSIBILITY:** HIGH.
- **ESTIMATED_SCOPE:** 3 files in `packages/security` and `packages/tenant-admin`.

### Candidate 3: CAND-003 — Asset Storage Quota & Storage Accounting Engine
- **LOCATION:** `packages/asset-manager-core`
- **PROBLEM:** `AssetStorage` manages file uploads but lacks quota calculation and quota boundary enforcement before storing binary buffers.
- **USER_VALUE:** Prevents storage overflow and enforces subscription tier storage limits.
- **TECHNICAL_VALUE:** Adds domain storage accounting and quota boundary validation.
- **AFFECTED_LAYERS:** 2 Layers (`STORAGE ENGINE` $\rightarrow$ `QUOTA DOMAIN`)
- **RISK:** MEDIUM.
- **TESTABILITY:** HIGH.
- **REVERSIBILITY:** HIGH.
- **ESTIMATED_SCOPE:** 3 files.

### Candidate 4: CAND-004 — Commerce Cart & Payment Pricing Calculator Sync
- **LOCATION:** `packages/commerce-engine` $\leftrightarrow$ `packages/commerce-persistence`
- **PROBLEM:** `PaymentEngine` processes order payments, but discount code recalculation is decoupled from cart pricing validation prior to payment capture.
- **USER_VALUE:** Ensures cart discount totals strictly match payment checkout totals.
- **TECHNICAL_VALUE:** Prevents price mismatch bugs between cart state and payment domain.
- **AFFECTED_LAYERS:** 2 Layers (`COMMERCE DOMAIN` $\rightarrow$ `PERSISTENCE API`)
- **RISK:** MEDIUM-HIGH.
- **TESTABILITY:** HIGH.
- **REVERSIBILITY:** HIGH.
- **ESTIMATED_SCOPE:** 3 files.

### Candidate 5: CAND-005 — Release Readiness Risk Score Calculator
- **LOCATION:** `packages/release-management` $\leftrightarrow$ `packages/release-readiness-intelligence`
- **PROBLEM:** `ChangelogAnalyzer` parses commits, but does not aggregate commit risk scores into `ReleaseReadinessModel`.
- **USER_VALUE:** Automated release gates block risky deployments automatically.
- **TECHNICAL_VALUE:** Connects release analytics to readiness scoring models.
- **AFFECTED_LAYERS:** 2 Layers (`RELEASE ANALYTICS` $\rightarrow$ `INTELLIGENCE MODEL`)
- **RISK:** LOW.
- **TESTABILITY:** HIGH.
- **REVERSIBILITY:** HIGH.
- **ESTIMATED_SCOPE:** 2 files.

---

## 2. CANDIDATE SELECTION MATRIX

| Candidate ID | Target Feature | Affected Layers | Product Value | Technical Value | Risk | Complexity | Testability | Scope Control | Selection Rank |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CAND-001** | Domain-to-API Health Summary Pipeline | **2 (`DOMAIN` $\rightarrow$ `API`)** | **HIGH** | **HIGH** | **LOW** | **OPTIMAL** | **EXCELLENT** | **STRICT (3 files)** | **#1 (SELECTED)** |
| **CAND-002** | Tenant Security Aggregator | 2 (`SECURITY` $\rightarrow$ `TENANT`) | HIGH | HIGH | MEDIUM | MEDIUM | GOOD | MEDIUM | #2 |
| **CAND-003** | Asset Storage Quota Engine | 2 (`STORAGE` $\rightarrow$ `QUOTA`) | MEDIUM | HIGH | MEDIUM | MEDIUM | GOOD | MEDIUM | #3 |
| **CAND-004** | Commerce Pricing Sync | 2 (`COMMERCE` $\rightarrow$ `PERSISTENCE`) | HIGH | HIGH | MED-HIGH | HIGH | GOOD | MEDIUM | #4 |
| **CAND-005** | Release Readiness Score | 2 (`ANALYTICS` $\rightarrow$ `MODEL`) | MEDIUM | MEDIUM | LOW | LOW | GOOD | SMALL | #5 |

---

## 3. AUTONOMOUS SELECTION DECISION

**SELECTED CANDIDATE:** `CAND-001` — Domain-to-API Health Summary & System Diagnostics Pipeline  

**REASON FOR SELECTION:**
1. Satisfies the mandatory complexity rule requiring **minimum 2 logically connected layers** (`DOMAIN` $\rightarrow$ `API`).
2. Leverages and validates `WF-HACP-PROD-001` domain progress (`HealthCheckEngine.getOverallStatus()`) in the live Next.js HTTP API layer (`src/app/api/diagnostics/route.ts`).
3. Low architectural risk, zero breaking changes, excellent testability using native `bun test`.
