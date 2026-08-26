# G1-33 — TEST INVENTORY FINAL & PASS/FAIL RECONCILIATION

**TASK ID:** `G1-33-CANVAS-MARQUEE-RECTANGLE-SELECTION`  
**PROJECT:** WEB FACTOR  
**PRODUCT:** VECTOR EDITING PRODUCT  
**GOVERNANCE GATE:** LAW-01 through LAW-10 Machine Verifiable Evidence  
**TIMESTAMP:** 2026-08-17  

---

## 1. EXECUTIVE SUMMARY

| Metric | Baseline (Pre G1-33) | Final (Post G1-33) | Delta | Reconciled Status |
| :--- | :--- | :--- | :--- | :--- |
| **TypeScript Compilation Errors** | 0 | 0 | 0 | ✅ CLEAN |
| **Vector Subsystem Total Tests** | 362 | 419 | **+57** | ✅ RECONCILED |
| **Vector Subsystem Passing Tests** | 359 | 416 | **+57** | ✅ 100% NEW PASS |
| **Vector Subsystem Failing Tests** | 3 | 3 | **0** | ✅ PRE-EXISTING ONLY |
| **G1-33 New Feature Tests** | 0 | 57 | **+57** | ✅ 57 / 57 PASS |
| **Regression Transitions (PASS -> FAIL)**| 0 | 0 | **0** | ✅ ZERO REGRESSIONS |

---

## 2. G1-33 TEST SUITE BREAKDOWN (`VectorMarqueeSelectionG133.test.ts`)

File: `packages/authoring-studio/src/vector/__tests__/VectorMarqueeSelectionG133.test.ts`  
Test Execution: `57 passed, 0 failed, 97 expect() assertions`

### Category 1: Core Marquee Behavior & Normalization (10 Tests)
1. `selects single node when marquee box intersects its bounding area` — PASS
2. `selects multiple nodes when marquee box spans across multiple shapes` — PASS
3. `selects all 4 nodes when marquee box encloses the entire canvas area` — PASS
4. `clears selection when marquee box is dragged on empty canvas region` — PASS
5. `handles Left-to-Right (top-left to bottom-right) drag normalization` — PASS
6. `handles Right-to-Left (top-right to bottom-left) drag normalization` — PASS
7. `handles Bottom-to-Top (bottom-left to top-right) drag normalization` — PASS
8. `handles Bottom-Right to Top-Left reverse drag normalization` — PASS
9. `handles zero-area click (p1 === p2) returning zero width/height` — PASS
10. `handles tiny sub-pixel marquee box safely without NaN coordinates` — PASS

### Category 2: Geometry & Hit Testing (10 Tests)
11. `rectIntersectsRect returns true for overlapping bounding boxes` — PASS
12. `rectIntersectsRect returns false for non-overlapping disjoint boxes` — PASS
13. `rectContainsRect returns true when container fully encloses target` — PASS
14. `rectContainsRect returns false when target partially extends outside container` — PASS
15. `nodeIntersectsMarquee in intersect mode selects partially overlapping shape` — PASS
16. `nodeIntersectsMarquee in contain mode rejects partially overlapping shape` — PASS
17. `nodeIntersectsMarquee in contain mode accepts fully enclosed shape` — PASS
18. `accounts for stroke width expansion during marquee intersection` — PASS
19. `tests line shape bounding box intersection with marquee` — PASS
20. `returns false cleanly when node has invalid / non-finite geometry` — PASS

### Category 3: Selection Semantics & Edge Cases (10 Tests)
21. `normal marquee replaces existing selection with newly enclosed nodes` — PASS
22. `additive marquee (Shift + Drag) merges with existing selection` — PASS
23. `ignores locked shapes during marquee selection` — PASS
24. `ignores hidden shapes (visible === false) during marquee selection` — PASS
25. `selects parent group node when marquee intersects child shape inside group` — PASS
26. `handles empty nodes document array returning empty selection without throwing` — PASS
27. `handles malformed marquee bounds with NaN or Infinity coordinates safely` — PASS
28. `handles negative width / height marquee gracefully` — PASS
29. `repeated marquee selection on the same region is idempotent` — PASS
30. `contain mode selects only shapes strictly inside the marquee boundary` — PASS

### Category 4: History, Persistence & Rendering (10 Tests)
31. `marquee selection does not pollute history stack with intermediate move frames` — PASS
32. `transforming marquee-selected nodes commits clean single history entry` — PASS
33. `undoing transform restores original coordinates for all marquee-selected nodes` — PASS
34. `redoing transform re-applies moved coordinates for all marquee-selected nodes` — PASS
35. `document persistence preserves node structure after marquee multi-selection` — PASS
36. `rendering bridge compiles render commands for all marquee-selected nodes` — PASS
37. `rendering bridge omits render commands for hidden nodes in marquee` — PASS
38. `marquee selection preserves snapshot immutability` — PASS
39. `persistent load followed by marquee drag selection functions seamlessly` — PASS
40. `reordering marquee-selected nodes maintains z-index stack integrity` — PASS

### Category 5: UI & Workspace Controller Integration (10 Tests)
41. `deselectAllNodes clears all marquee-selected IDs` — PASS
42. `selectAllNodes selects all 4 nodes matching full marquee selection` — PASS
43. `resizing marquee-selected multi-shape set scales all coordinates proportionally` — PASS
44. `toggling lock on marquee-selected set locks all selected nodes` — PASS
45. `toggling visibility on marquee-selected set hides all selected nodes` — PASS
46. `grouping marquee-selected shapes creates a single ShapeGroupNode` — PASS
47. `moving locked nodes inside marquee selection is rejected by controller` — PASS
48. `updating properties of marquee-selected node preserves multi-selection set` — PASS
49. `selectNodes cleanly prunes non-existent IDs if passed in marquee result` — PASS
50. `rapid successive marquee dispatches maintain transactional state consistency` — PASS

### Category 6: Real End-to-End Vertical Slices (7 Tests)
51. `E2E-01: USER ACTION → MARQUEE → DOCUMENT / SELECTION → RENDER` — PASS
52. `E2E-02: USER ACTION → MULTI-SELECTION → TRANSFORM → FINAL SELECTION` — PASS
53. `E2E-03: USER ACTION → SAVE → LOAD → CONTINUE EDITING WITH MARQUEE` — PASS
54. `E2E-04: USER ACTION → MARQUEE → UNDO → REDO → FINAL STATE` — PASS
55. `E2E-05: USER ACTION → FAILURE INJECTION → ROLLBACK → ORIGINAL STATE` — PASS
56. `E2E-06: USER ACTION → EXISTING SELECTION → ADDITIVE MARQUEE → FINAL SELECTION` — PASS
57. `E2E-07: USER ACTION → GROUP / LOCK / VISIBILITY → MARQUEE → VERIFIED RESULT` — PASS

---

## 3. PRE-EXISTING FAILURES AUDIT (VERIFIED CONSTANT)

The 3 failing tests in the Vector subsystem were verified as pre-existing prior to G1-33:
1. `ETAP 2 — ShapeGrouping > groups multiple shapes into a ShapeGroupNode` (Pre-existing in S18)
2. `ETAP 2 — ShapeGrouping > ungroups a ShapeGroupNode into child shapes with relative transform restoration` (Pre-existing in S18)
3. `ETAP 2/3 — ShapeTransform > aligns multiple shapes to left, center, right, top, middle, bottom` (Pre-existing in S18)

**Verified Delta for Failures:** $\Delta = 0$.
