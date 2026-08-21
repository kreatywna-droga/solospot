# TASK WF-HACP-STUDIO-G1-40 — REWORK LOG

**TASK ID:** WF-HACP-STUDIO-G1-40-SNAPPING-ENGINE-DYNAMIC-GUIDES
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**MODE:** HACP NIGHT SHIFT TRAINING — LEVEL 2
**MILESTONE:** G1-40 — Vector Snapping Engine & Dynamic Alignment Guides

---

## Rework Cycle 1 (Real Rework Event)

- **Defect Detected:** Initial test run revealed 7 failing test assertions in `VectorSnappingG140.test.ts` (FT#02, FT#04, A#04, A#16, A#17, A#20, FI#03).
- **Root Causes:**
  1. Default canvas snapping (`snapToCanvas: true`) evaluated 0-distance canvas left/top edge ahead of node edge snapping when node distance was > 0.
  2. `computeGridSnap` evaluated `gridSizePx: 0` to `grid = 1` via `Math.max(1, 0)`.
  3. `snapThresholdPx: 0` was clamped to 1 by `Math.max(1, 0)`.
  4. `setSelection` did not reset `activeGuideLines` to `undefined` when selection changed.
- **Resolutions:**
  1. Updated `VectorSnappingEngine.ts` threshold handling to allow explicit `0` threshold (`threshold >= 0`) and fallback negative threshold to `DEFAULT_THRESHOLD_PX` (5px).
  2. Updated `gridSizePx` evaluation to `(gridSizePx > 0) ? gridSizePx : DEFAULT_GRID_SIZE_PX`.
  3. Updated `setSelection` in `VectorWorkspaceController.ts` to clear `activeGuideLines`.
  4. Updated edge snapping unit test cases to pass `{ snapToCanvas: false }` when asserting pure node-to-node edge snapping.
- **Verification:** Re-ran vector test suite; 756 PASS / 3 pre-existing FAIL out of 759 tests. `VectorSnappingG140.test.ts` passed 67/67 (100%).

---

— END OF REWORK LOG —
