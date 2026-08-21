# TASK WF-HACP-STUDIO-G1-39 — INTENT DOCUMENT

**TASK ID:** WF-HACP-STUDIO-G1-39-SELECTION-TRANSFORM-SYSTEM
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-39 — Professional Selection & Transform System

---

## 1. Intent Statement

The objective of Task G1-39 is to deliver a unified, professional selection state management and multi-object transform engine in Authoring Studio (`VectorEditingEngine.ts`, `VectorWorkspaceController.ts`).

It introduces:
1. **Explicit Selection Management:** `setSelection`, `addToSelection`, `removeFromSelection`, `toggleSelection`, `clearSelection`, and tight `computeSelectionBounds` calculations.
2. **Document-Space Movement:** `moveSelectedNodes` for translating single or multi-shape selections in document space.
3. **Proportional & Non-Proportional Scaling:** `scaleSelectedNodes` relative to selection center or custom transform origin $(ox, oy)$ with zero/near-zero scale safeguards (`Math.abs(s) >= 1e-6`).
4. **Multi-Object Rotation:** `rotateSelectedNodes` around selection center or custom origin $(ox, oy)$ supporting exact 90°, 180°, 270°, 360° and arbitrary angle rotations.
5. **Composed Matrix Transforms:** `transformSelectedNodes` for applying combined translation, scaling, and rotation in a single operation.
6. **Strict SSOT & History Transactionality:** `VectorDocumentSnapshot` remains the single source of truth for persistent document geometry. Transient transform preview produces 0 history entries; finalized user operations push exactly 1 transaction to `HistoryStack`.

---

— END OF INTENT —
