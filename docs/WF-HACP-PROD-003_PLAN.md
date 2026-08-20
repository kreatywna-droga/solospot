# TASK WF-HACP-PROD-003 — IMPLEMENTATION & VERIFICATION PLAN

**TASK ID:** WF-HACP-PROD-003  
**FEATURE:** Tenant Lifecycle Security Audit & Context Pipeline  
**SELECTED CANDIDATE:** CAND-001  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## 1. OBJECTIVE & SCOPE

### Objective
Create `TenantSecurityManager` in `packages/tenant-admin` to orchestrate tenant organization management across **3 distinct architectural layers**:
1. **Layer 1 (`packages/tenant-admin`):** `OrganizationManager` / `TenantSecurityManager` CRUD operations (`createTenant`, `updateTenantStatus`, `deleteTenant`).
2. **Layer 2 (`packages/platform-core`):** `TenantContextBuilder` for schema parsing, plan tier assignment (`FREE`, `GROWTH`, `ENTERPRISE`), capability configuration, and context freezing.
3. **Layer 3 (`packages/security`):** `AuditLogger` for structured security event logging (`organizationId`, `action`, `resource`, `details`, `timestamp`).

### In-Scope Files
1. `packages/tenant-admin/src/TenantSecurityManager.ts` (NEW: 3-layer orchestrator class)
2. `packages/tenant-admin/src/index.ts` (Export `TenantSecurityManager`)
3. `packages/tenant-admin/src/TenantSecurityManager.test.ts` (NEW: Feature, integration, adversarial, failure injection & rollback tests)

---

## 2. DEPENDENCIES & RUNTIME

- **Runtime:** Node.js / Bun (`bun test`)
- **Package Dependencies:** `packages/tenant-admin`, `packages/platform-core`, `packages/security`

---

## 3. IMPLEMENTATION STEPS

1. **Step 1 (`packages/tenant-admin/src/TenantSecurityManager.ts`):**
   - Implement `TenantSecurityManager` class taking `OrganizationManager`, `TenantContextBuilder`, and `AuditLogger` in constructor or defaulting.
   - Implement `createTenant(org, tier, limits, capabilities)`:
     - Saves org via `OrganizationManager.create(org)`.
     - Builds frozen `TenantContext` via `TenantContextBuilder`.
     - Logs audit entry via `AuditLogger.critical(org.id, 'TENANT_CREATED', { tier, status: 'ACTIVE' })`.
     - Returns `{ organization, context, auditLog }`.
   - Implement `updateTenantStatus(id, status, reason)`:
     - Updates status via `OrganizationManager.update(id, { status })`.
     - Re-builds frozen `TenantContext` with updated status.
     - Logs audit entry via `AuditLogger.critical(id, 'TENANT_STATUS_UPDATED', { status, reason })`.
     - Returns `{ organization, context, auditLog }`.
   - Implement `deleteTenant(id, reason)`:
     - Removes org via `OrganizationManager.delete(id)`.
     - Logs audit entry via `AuditLogger.critical(id, 'TENANT_DELETED', { reason })`.
     - Returns boolean result.
2. **Step 2 (`packages/tenant-admin/src/index.ts`):**
   - Export `TenantSecurityManager`.
3. **Step 3 (`packages/tenant-admin/src/TenantSecurityManager.test.ts`):**
   - Write Vitest / Bun test cases covering normal workflow, plan tier limits, frozen context immutability, audit trail queries, invalid input exception handling, and failure injection rollback.

---

## 4. TESTING & REGRESSION STRATEGY

- **Deterministic Testing:** Run `bun test packages/tenant-admin packages/security packages/platform-core/src/tenant`.
- **Adversarial Testing:** Test invalid tenant IDs, malformed plan tier schemas, frozen context mutation attempts, and audit logger exception isolation.
- **Controlled Failure Injection & Rollback:** Simulate `AuditLogger` or `TenantContextBuilder` exception during tenant creation and verify that `OrganizationManager` state is safely rolled back (no partial tenant state).
- **Regression Suite:** Run `bun test packages/reliability packages/design-tokens packages/security packages/tenant-admin`.
- **Target:** 100% test pass rate, `PASS_TO_FAIL = 0`.
