# TASK WF-HACP-STUDIO-G1-34 — ARCHITECTURE DECISION RECORD (ADR)

**TASK ID:** WF-HACP-STUDIO-G1-34  
**TITLE:** Path Pen Tool — Bezier Curve Drawing & Node Editing Architecture  
**STATUS:** APPROVED  
**DECISION MAKER:** Architect Worker (`opencode/claude-3-5-sonnet`)  
**DATE:** 2026-08-20  

---

## 1. EXISTING PATH & VECTOR ARCHITECTURE

The current WEB FACTOR Authoring Studio vector subsystem (`packages/authoring-studio/src/vector`) comprises:
- `VectorDomainModel.ts`: Headless DTO types (`VectorNode`, `PathNode`, `PathCommandDTO`, `VectorTransform`, `VectorFill`, `VectorStroke`).
- `VectorGeometry.ts`: Pure mathematics (`parsePathGeometry`, `computePathLength`, `computeBoundingBox`, `nodeIntersectsMarquee`).
- `VectorEditingEngine.ts`: Shape operations (create, duplicate, resize, move, align, distribute, group, reorder).
- `VectorWorkspaceController.ts`: Immutable state snapshot management (`VectorWorkspaceState`, `VectorDocumentSnapshot`) integrated with `HistoryStack`.
- `VectorDocumentSerializer.ts`: Lossless JSON document serialization/deserialization.
- `VectorRenderingBridge.ts`: DTO compiler producing `RendererCommand`s (`DRAW_PATH`, `DRAW_RECT`, etc.).

---

## 2. IDENTIFIED REUSABLE COMPONENTS

1. **`PathNode` & `PathCommandDTO`**: `PathNode` already exists with `type: 'path'` and `d: string`.
2. **`VectorGeometry.parsePathGeometry`**: Parses SVG `d` strings into command DTOs (`M`, `L`, `C`, `Q`, `A`, `Z`).
3. **`VectorWorkspaceController` & `HistoryStack`**: Pure functional workspace state updater with immutable undo/redo stack.
4. **`VectorRenderingBridge`**: Converts `PathNode` into `DRAW_PATH` renderer command.
5. **G1-33 Marquee Selection**: `selectNodesInMarquee()` in `VectorWorkspaceController.ts` operates on `VectorNode` bounds.

---

## 3. REQUIRED EXTENSIONS & NEW CONTRACTS

To support lossless Bezier curve drawing and node editing, we introduce the following DTO interfaces in `VectorDomainModel.ts`:

```ts
export type VectorNodeType = 'corner' | 'smooth' | 'symmetric';

export interface VectorPathAnchor {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly handleIn?: { readonly x: number; readonly y: number };
  readonly handleOut?: { readonly x: number; readonly y: number };
  readonly type?: VectorNodeType;
}

export interface VectorPathData {
  readonly anchors: ReadonlyArray<VectorPathAnchor>;
  readonly closed: boolean;
}
```

We extend `PathNode`:
```ts
export interface PathNode extends BaseVectorNode {
  readonly type: 'path';
  readonly d: string; // SVG Path string
  readonly commands?: PathCommandDTO[];
  readonly pathData?: VectorPathData;
}
```

---

## 4. ARCHITECTURAL RESPONSIBILITIES & LAYER MATRIX

1. **`VectorPenEngine.ts` (NEW)**:
   - Manages active Pen drawing sessions (`PenDrawingSession`).
   - Generates transient preview SVG path data during pointer drag/move.
   - Computes cubic Bezier control points and SVG `d` strings.
   - Provides pure node editing functions (`moveAnchorPoint`, `moveControlHandle`, `convertNodeType`, `addNodeToSegment`, `deleteNodeFromPath`).
2. **`VectorWorkspaceController.ts` (EXTENDED)**:
   - Exposes transactional methods for starting drawing, updating preview, adding anchors, finishing path, cancelling drawing, and node editing.
   - Live pointer movements update preview state without pushing to `HistoryStack`.
   - Path completion or edit commits push clean snapshot to `HistoryStack`.
3. **`VectorDocumentSerializer.ts` (EXTENDED)**:
   - Serializes `PathNode` along with `pathData` (anchors, handleIn, handleOut, type, closed) ensuring 100% roundtrip preservation.
4. **`VectorRenderingBridge.ts` (EXTENDED)**:
   - Renders committed `PathNode`s via `DRAW_PATH`.

---

## 5. SSOT & TRANSACTION BOUNDARIES

- **SSOT OWNER:** `VectorWorkspaceState.snapshot.nodes` (in `VectorWorkspaceController.ts`).
- **TRANSACTION BOUNDARY:** Live pointer drag frames remain transient in local controller state or session. Only finalized path creations or explicit node edits trigger `historyStack.push()`.
- **ROLLBACK STRATEGY:** On any exception during path creation or editing, the operation returns the input state unharmed (`Transaction Integrity`).
