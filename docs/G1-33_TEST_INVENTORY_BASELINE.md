# G1-33 TEST INVENTORY — FRESH BASELINE

- **Task ID:** `G1-33-CANVAS-MARQUEE-RECTANGLE-SELECTION`
- **Scope:** Vector Subsystem Baseline Test Inventory
- **Date:** 2026-08-17

---

## 1. Baseline Summary

| Suite Scope | Discovered Files | Total Test Cases | Passed | Failed | Pre-Existing Failures |
|---|---:|---:|---:|---:|---:|
| **TypeScript (`tsc --noEmit`)** | N/A | 0 errors | 0 | 0 | 0 |
| **Vector Subsystem Suite** | 21 | 362 | 359 | 3 | 3 |
| **Authoring Studio Package** | 98 | 3,367 | 3,330 | 37 | 37 |

---

## 2. Vector Subsystem Baseline Test Files (21 Files)

1. `ShapeAnimation.test.ts` (14 tests — PASS)
2. `ShapeDomainModel.test.ts` (18 tests — PASS)
3. `ShapeEditing.test.ts` (15 tests — PASS)
4. `ShapeGeometry.test.ts` (22 tests — PASS)
5. `ShapeGrouping.test.ts` (10 tests — 8 PASS, 2 FAIL [pre-existing])
6. `ShapeHistory.test.ts` (12 tests — PASS)
7. `ShapeRendering.test.ts` (14 tests — PASS)
8. `ShapeTransform.test.ts` (9 tests — 8 PASS, 1 FAIL [pre-existing])
9. `VectorAutonomousProductEvolutionG131.test.ts` (45 tests — PASS)
10. `VectorBooleanEngine.test.ts` (16 tests — PASS)
11. `VectorBooleanIntegration.test.ts` (18 tests — PASS)
12. `VectorDocumentLifecycle.test.ts` (30 tests — PASS)
13. `VectorIntegration.test.ts` (15 tests — PASS)
14. `VectorLayerManagementG132.test.ts` (45 tests — PASS)
15. `VectorProductionHardeningG130.test.ts` (35 tests — PASS)
16. `VectorWorkspaceAdversarial.test.ts` (12 tests — PASS)
17. `VectorWorkspaceController.test.ts` (14 tests — PASS)
18. `VectorWorkspaceProductFlow.test.ts` (14 tests — PASS)
19. `VectorWorkspaceProductionReadiness.test.ts` (33 tests — PASS)
20. `VectorWorkspaceTransaction.test.ts` (18 tests — PASS)
21. `VectorWorkspaceVerticalSlice.test.ts` (25 tests — PASS)

---

## 3. Pre-Existing Failures (3 Total)

1. `ETAP 2 — ShapeGrouping > groups multiple shapes into a ShapeGroupNode` (FAIL)
2. `ETAP 2 — ShapeGrouping > ungroups a ShapeGroupNode into child shapes with relative transform restoration` (FAIL)
3. `ETAP 2/3 — ShapeTransform > aligns multiple shapes to left, center, right, top, middle, bottom` (FAIL)
