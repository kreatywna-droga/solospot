# TASK WF-HACP-PROD-003 — TASK INTENT & CHARTER

**TASK ID:** WF-HACP-PROD-003  
**PROGRAM:** WEB FACTOR AUTONOMOUS PRODUCT DEVELOPMENT  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**MODE:** FULL AUTONOMOUS CONTROLLED PRODUCTION EXECUTION  
**TYPE:** THIRD RATIFIED REAL WEB FACTOR DEVELOPMENT TASK — THREE-LAYER VERTICAL SLICE  

---

## 1. MISSION STATEMENT

Execute the third autonomous development task for WEB FACTOR under HACP governance. The task must form a **real connected vertical slice crossing at least three distinct architectural layers**:
`LAYER 1 (packages/tenant-admin) → LAYER 2 (packages/platform-core) → LAYER 3 (packages/security)`

---

## 2. KEY CONSTRAINTS & PRINCIPLES

1. **THREE-LAYER REQUIREMENT:** The feature must cross 3 real architectural layers with genuine data and control flow:
   `TenantSecurityManager` ($\text{LAYER 1}$) $\rightarrow$ `TenantContextBuilder` ($\text{LAYER 2}$) $\rightarrow$ `AuditLogger` ($\text{LAYER 3}$) $\rightarrow$ Validated Frozen Tenant Context + Security Audit Trail ($\text{REAL RESULT}$).
2. **NO ARTIFICIAL ABSTRACTIONS:** Artificial classes or dummy wrappers created solely to satisfy the multi-layer condition are strictly forbidden.
3. **WORKFORCE & MODEL SELECTIONRigOR:** Worker roles and Model Seats must be selected based on capability requirements, task complexity, and evidence-based justification.
4. **ADVERSARIAL & FAILURE INJECTION TESTING:** The feature must undergo deterministic testing, adversarial falsification, controlled failure injection, and rollback verification.
5. **CONTROLLED TERMINATION:** Following post-commit verification, the run must terminate with a `CONTROLLED STOP`.
