# TASK WF-HACP-STUDIO-G1-40 — INTENT DOCUMENT

**TASK ID:** WF-HACP-STUDIO-G1-40-SNAPPING-ENGINE-DYNAMIC-GUIDES
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**MODE:** HACP NIGHT SHIFT TRAINING — LEVEL 2
**MILESTONE:** G1-40 — Vector Snapping Engine & Dynamic Alignment Guides

---

## 1. Intent Statement

The objective of Task G1-40 is to deliver a multi-layer snapping geometry engine and dynamic alignment guide overlay generator (`VectorSnappingEngine.ts`, `VectorWorkspaceController.ts`) as a core capability of Authoring Studio.

It introduces:
1. **Edge-to-Edge & Center-to-Center Snapping:** Snapping target shape edges (left, right, top, bottom) and center axes (centerX, centerY) against reference nodes within a configurable threshold (`snapThresholdPx: 5px`).
2. **Canvas & Grid Snapping:** Snapping target shapes to canvas boundary origins/edges (x=0, y=0, width=1920, height=1080) and canvas grid lines (`gridSizePx: 20px`).
3. **Dynamic Visual Alignment Guide Lines (`GuideLine`):** Generates transient guide line DTOs mapped to viewport screen space (`VectorViewportController`) to visually highlight active snap alignment edges.
4. **Workspace Actions with Snapping:** `moveSelectedNodesWithSnapping` and `scaleSelectedNodesWithSnapping` for smooth interactive manipulation.
5. **Strict SSOT & History Transactionality:** `VectorDocumentSnapshot` remains single source of truth for persistent document geometry. Transient guide lines do NOT alter `HistoryStack`. Only finalized snapped shape coordinates commit 1 history transaction.
6. **Night Shift Level 2 Pipeline:** Demonstrates multi-stage pipeline execution (5 stages), 2 controlled recovery interruptions, 1 real rework event, 5 failure injection points, and 100% context retention.

---

— END OF INTENT —
