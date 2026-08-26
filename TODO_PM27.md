# TODO — PM27 (Agent 1) Sprint 7 Inspector 2.0 Final Integration

> Status: IN PROGRESS (NOT PASS/APPROVED/ACCEPTED/COMPLETE/CLOSED)
> Final report status: READY FOR PM27 ARCHITECT REVIEW

## Scope (Architect-approved PM27 decision)

### 1. Tests (node env, no jsdom)
- [ ] Create `packages/authoring-studio/src/inspector/__tests__/BuilderInspectorIntegration.test.ts`
- [ ] Create `packages/authoring-studio/src/inspector/__tests__/SelectionFlow.test.ts`
- [ ] Create `packages/authoring-studio/src/inspector/__tests__/PreviewSync.test.ts`
- [ ] Create `packages/authoring-studio/src/inspector/__tests__/RegistryConsistency.test.ts`

### 2. Documentation
- [ ] Update `TODO_SPRINT7_RECOVERY.md` with executed work
- [ ] Set final report status to `READY FOR PM27 ARCHITECT REVIEW`
- [ ] NO new reports / documents / audits / plans (Documentation Freeze)

### 3. Implementation
- [ ] No unnecessary refactorings (integration already complete)
- [ ] Only fix minor defects detected by tests

### 4. Quality Gates (mandatory, fresh logs)
- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run build`

## ZAKAZY
- No PM28
- No removal of Legacy Inspector
- No Builder Runtime changes beyond PM27 scope
- No Runtime Pipeline / Commerce Engine / Platform Core changes
- No Sprint 8
- No new project documents
- No PASS/COMPLETE/APPROVED/ACCEPTED/CLOSED declarations
