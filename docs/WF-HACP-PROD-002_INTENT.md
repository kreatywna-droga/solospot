# TASK WF-HACP-PROD-002 — TASK INTENT & CHARTER

**TASK ID:** WF-HACP-PROD-002  
**PROGRAM:** WEB FACTOR AUTONOMOUS PRODUCT DEVELOPMENT  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**MODE:** FULL AUTONOMOUS CONTROLLED PRODUCTION EXECUTION  
**TYPE:** SECOND RATIFIED REAL WEB FACTOR DEVELOPMENT TASK  
**PARENT TASK:** WF-HACP-PROD-001  

---

## 1. MISSION STATEMENT

Execute the second autonomous development task for WEB FACTOR under HACP governance. The task must demonstrate increased complexity over `WF-HACP-PROD-001` by spanning **at least 2 logically connected architectural layers** (`DOMAIN` $\rightarrow$ `API`), maintaining absolute workforce isolation, model seat optimization, test discipline, rework enforcement, regression reconciliation, and governance commit approval.

---

## 2. KEY PRINCIPLES

1. **AUTONOMY:** HACP autonomously discovers, selects, plans, implements, tests, audits, and commits the feature without requiring user intervention.
2. **COMPLEXITY:** Spans 2 connected layers: `DOMAIN` (`HealthCheckEngine` / `SystemDiagnosticProbe` in `packages/observability`) $\rightarrow$ `API` (`src/app/api/diagnostics/route.ts`).
3. **WORKFORCE ISOLATION:** Distinct roles and model seats for Orchestrator, Architect, Developer, Tester, and Auditor.
4. **EVIDENCE GOVERNANCE:** Every claim must be backed by physical filesystem, code diff, or test execution evidence.
5. **CONTROLLED TERMINATION:** Following post-commit verification, the run must terminate with a `CONTROLLED STOP`.
