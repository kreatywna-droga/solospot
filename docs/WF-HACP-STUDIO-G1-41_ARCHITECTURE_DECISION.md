# WF-HACP-STUDIO-G1-41 Architecture Decision Log (ADR)

## DECISION-046: Transient Transform Session State Isolation
- **Context**: Interactive transform sessions require rapid 60 FPS pointer updates with real-time guide overlays.
- **Decision**: Transient session state (`activeTransformSession`) resides strictly inside `VectorWorkspaceState` and is NEVER pushed to `HistoryStack`. Only `commitTransformSessionAction` pushes 1 transaction to `HistoryStack`. `cancelTransformSessionAction` reverts state with 0 history entries.
- **Consequences**: Zero history bloat during drag operations, 100% undo/redo cleanliness, complete transaction safety.

## DECISION-047: Viewport Projection Decoupling
- **Context**: Pointer coordinates on screen must be projected into canvas space taking viewport zoom and pan into account.
- **Decision**: Screen pointers are transformed via `viewportToCanvasPoint` before calculating drag geometry. Interaction engine functions remain pure and decoupled from DOM/browser events.
