# TASK WF-HACP-STUDIO-G1-40 — IMMUTABLE MISSION CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-40-SNAPPING-ENGINE-DYNAMIC-GUIDES
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**MODE:** HACP NIGHT SHIFT TRAINING — LEVEL 2
**MILESTONE:** G1-40 — Vector Snapping Engine & Dynamic Alignment Guides
**BASELINE:** `92d44c9`

---

## 1. Mission Statement

Deliver the Vector Snapping Engine & Dynamic Alignment Guides (`VectorSnappingEngine.ts`, `VectorWorkspaceController.ts`) in Authoring Studio supporting edge-to-edge, center-to-center, canvas, and grid snapping during object movement and resizing, generating transient visual guide lines (`GuideLine`), preserving `VectorDocumentSnapshot` SSOT, isolating transient guide overlays from `HistoryStack`, executing 5 dependent stages with 2 controlled recovery interruptions, and passing 67 deterministic tests.

## 2. Scope & Non-Goals

### In-Scope
- `VectorSnappingEngine.ts`: `computeSnapDelta`, `computeGridSnap`, `generateAlignmentGuides`.
- `VectorWorkspaceController.ts`: `moveSelectedNodesWithSnapping`, `scaleSelectedNodesWithSnapping`, transient `activeGuideLines` state.
- Integration across Viewport, SVG Exporter, Pen Tool, Rendering Bridge, Serializer, and HistoryStack.
- 5-stage pipeline, 2 controlled recovery interruptions, 1 real rework event, 5 failure injection points.

### Non-Goals
- Custom user-drawn guide line creation or persistent guide document storage.
- Non-vector DOM-based layout snapping outside Authoring Studio `src/vector`.

## 3. Single Source of Truth (SSOT) & History Isolation

- **SSOT:** `VectorDocumentSnapshot` remains single source of truth for persistent document geometry.
- **Transient State Isolation:** `activeGuideLines` are editor overlays and do NOT pollute `HistoryStack` or `VectorDocumentSnapshot`.
- **History Commit:** 1 completed snapped user operation = 1 `HistoryStack` transaction.

## 4. Rollback & Interruption Strategy

- **Controller Exception Rollback:** In case of unhandled runtime failure during snapping, input workspace state is returned unharmed.
- **Interruption Recovery:** 2 controlled recovery interruptions (after Stage 2 and Stage 4) recreate mission contract, checkpoint, and remaining stage graph without duplicating work (`DUPLICATED_WORK = NO`).

---

— END OF IMMUTABLE MISSION CONTRACT —
