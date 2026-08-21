# TASK WF-HACP-STUDIO-G1-37 — INTENT DOCUMENT

**TASK ID:** WF-HACP-STUDIO-G1-37-VECTOR-VIEWPORT-CONTROLLER
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-37 — Vector Viewport & Camera Controller

---

## 1. Intent Statement

The objective of Task G1-37 is to deliver a pure, headless **Vector Viewport & Camera Controller** (`VectorViewportController.ts`) and integrate canvas camera transformations (zoom, pan, focal zoom, fit-to-screen, fit-to-selection) into the Vector Editor stack (`VectorRenderingBridge.ts`, `VectorWorkspaceController.ts`).

## 2. Business & Product Rationale

- **Navigation Parity:** Pro vector graphics editors require zooming, panning, fit-selection, and focal zooming. Operating strictly in raw document coordinates limits canvas usability.
- **Strict SSOT Preservation:** Viewport navigation is purely presentation state projection. Navigating the canvas must NEVER mutate the underlying `VectorDocumentSnapshot` or create unwanted history entries in `HistoryStack`.
- **Seamless Coordinate Translation:** Interactivity (marquee selection, click targeting, drawing) requires bidirectional translation between screen viewport coordinates and document canvas coordinates.

## 3. Scope Boundaries

- **IN SCOPE:**
  - `VectorViewportController.ts` (pure headless state model & transform utilities).
  - Viewport focal point zoom, scale clamping `[0.05, 50.0]`, pan deltas, fit-to-screen, fit-to-selection.
  - Bidirectional coordinate mapping (`canvasToViewportPoint`, `viewportToCanvasPoint`, `viewportToCanvasBounds`, `canvasToViewportBounds`).
  - Viewport transform matrix composition in `VectorRenderingBridge.ts`.
  - Comprehensive deterministic test suite (`VectorViewportG137.test.ts`).

- **OUT OF SCOPE:**
  - DOM event listeners or React hooks (must remain pure TypeScript).
  - Mutations to `VectorDocumentSnapshot` or `HistoryStack`.
  - Pre-existing baseline test failure modifications (`ShapeGrouping.test.ts`, `ShapeTransform.test.ts`).

---

— END OF INTENT —
