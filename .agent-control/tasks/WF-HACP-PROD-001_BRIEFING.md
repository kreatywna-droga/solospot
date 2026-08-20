# TASK BRIEFING: WF-HACP-PROD-001

**TASK ID:** WF-HACP-PROD-001  
**TARGET PACKAGE:** `packages/observability`  
**ASSIGNED ROLE:** DEVELOPER  
**MODEL SEAT:** `opencode/deepseek-v4-flash-free`  
**RUNTIME:** Bun / Node Native Engine (`bun test`)  
**HACP GOVERNANCE:** LEVEL 2 EXPERT / ARCHITECT  

---

## OBJECTIVE

Implement `getOverallStatus()` in `HealthCheckEngine` (`packages/observability`) returning an aggregated `SystemHealthSummary` object.

---

## REQUIREMENTS

1. Update `packages/observability/src/ObservabilityDomain.ts`:
   - Add interface `SystemHealthSummary`:
     ```ts
     export interface SystemHealthSummary {
       status: 'healthy' | 'degraded' | 'unhealthy';
       totalChecks: number;
       healthyCount: number;
       degradedCount: number;
       unhealthyCount: number;
       checks: HealthCheck[];
       timestamp: string;
     }
     ```

2. Update `packages/observability/src/HealthCheckEngine.ts`:
   - Add method `async getOverallStatus(): Promise<SystemHealthSummary>`:
     - Run all checks via `this.runAllChecks()`.
     - Count `healthy`, `degraded`, `unhealthy` checks.
     - Calculate aggregated status:
       - If `unhealthyCount > 0` or `totalChecks === 0` $\rightarrow$ `'unhealthy'`
       - Else if `degradedCount > 0` $\rightarrow$ `'degraded'`
       - Else $\rightarrow$ `'healthy'`
     - Return `SystemHealthSummary` object containing `status`, `totalChecks`, `healthyCount`, `degradedCount`, `unhealthyCount`, `checks`, and `timestamp`.

3. Create `packages/observability/src/HealthCheckEngine.test.ts`:
   - Write Vitest/Bun unit tests for `getOverallStatus()`:
     - Test status `'healthy'` when all checks pass.
     - Test status `'degraded'` when a check returns status `'degraded'`.
     - Test status `'unhealthy'` when a check returns status `'unhealthy'`.
     - Test boundary condition: status `'unhealthy'` when no checks are registered (`totalChecks === 0`).
     - Test `runCheck(name)` returns expected check or `undefined`.

4. Update `packages/observability/src/index.ts`:
   - Export `SystemHealthSummary`.

---

## CONSTRAINTS

- Do not modify files outside `packages/observability`.
- Do not suppress errors or comment out assertions.
- Ensure 100% test pass rate in `bun test packages/observability`.
