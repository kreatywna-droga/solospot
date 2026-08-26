# Sprint 7 Recovery — Progress Tracker (Agent 1)

> Status: IN PROGRESS (NOT PASS/APPROVED/ACCEPTED/COMPLETE/CLOSED)
> Final report status: READY FOR PM26 SUPPLEMENTAL AUDIT
>
> BuilderShell integration was performed as a minimal compatibility bridge.
> Legacy Inspector remains intact.
> No architectural migration has been completed.
>
> PM26-HOLD-FIX-5 (2026-08-04): Fixed Inspector test evidence.
> Fresh log `vitest_s7_recovery.log` now shows 8/8 files PASS, 73/73 tests PASS,
> including DynamicPropertyPanel.test.ts (9/9). The previous "1 failed" blocker
> no longer reproduces in the current repo state.

## Scope (Architect v2 approval — narrowed)

### P1 — Inspector Integration (ZAWĘŻONE)
- [ ] 1.1 Refactor `DynamicPropertyPanel.tsx` — remove `switch/case`, resolve widgets via PropertyRegistry only
- [ ] 1.2 Register Agent 3's 14 widgets in `packages/authoring-studio/src/inspector/registry/propertyFieldRegistry.ts`
- [ ] 1.3 Add PropSchema.type → WidgetType adapter (if needed)
- [ ] 1.4 Create `InspectorShellAdapter.tsx` (allows running new Inspector WITHOUT replacing legacy)
- [ ] 1.5 Do NOT switch BuilderShell, do NOT remove legacy InspectorPanel/fields/renderers

### P2 — Tests (node env, no jsdom)
- [ ] 2.1 `InspectorShell.test.ts`
- [ ] 2.2 `DynamicPropertyPanel.test.ts`
- [ ] 2.3 `PropertyRegistry.test.ts`
- [ ] 2.4 `RuntimeSync.test.ts`
- [ ] 2.5 `StateConsistency.test.ts`

### P3 — Performance Verification
- [ ] 3.1 Single-change = single dispatch (no loops, no double renders)
- [ ] 3.2 Only remove detected regressions

### P4 — Order Status API (highest architectural debt)
- [ ] 4.1 Create `src/app/api/store/order/[id]/route.ts` (server-side, tenant by slug, 404 cross-tenant / missing, 400 bad slug)
- [ ] 4.2 Refactor `order/[id]/page.tsx` to fetch via `GET /api/store/order/[id]`, remove client `OrderRuntime`
- [ ] 4.3 Add `route.test.ts` (valid tenant, cross-tenant→404, missing→404, static check no 'use client' imports OrderRuntime)

### P5 — Quality Gates
- [ ] 5.1 `npx vitest run`
- [ ] 5.2 `npx tsc --noEmit`
- [ ] 5.3 `npm run build`

## ZAKAZY
- No Sprint 8
- No Runtime Pipeline / Commerce Engine / Platform Core changes
- No Builder Runtime changes beyond Inspector integration
- No Completion Report / new project docs / roadmap changes
- No PASS/COMPLETE/CLOSED/APPROVED/ACCEPTED declarations
