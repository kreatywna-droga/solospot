# G1-30 Architecture Decisions Log

## Cycle 1: Data Integrity & Geometry Validation (Category A)
- **Decision:** Implemented `VectorGeometry.normalizeTransform()` and `VectorGeometry.isValidNodeGeometry()`.
- **Rationale:** Ensures finite numerical coordinates and non-negative bounds before processing shapes in domain calculations or rendering compilers.

## Cycle 2: History & Transaction Safety (Category B)
- **Decision:** Implemented `isEqualSnapshots(a, b)` snapshot equivalence checking in `VectorWorkspaceController.ts`.
- **Rationale:** Prevents pushing redundant duplicate snapshots to `HistoryStack` when state dispatchers produce unchanged document outputs.

## Cycle 3: Persistence & Schemaless Recovery (Category C)
- **Decision:** Enhanced `VectorDocumentSerializer.restoreVectorDocument()` to return `skippedNodeCount` in `VectorDocumentRestoreResult`.
- **Rationale:** Provides recovery transparency when restoring JSON files containing un-parseable or malformed shape DTOs.

## Cycle 4: Clipboard & Identity Integrity (Category D)
- **Decision:** Bounded cumulative spatial paste offset in `VectorClipboardEngine.pasteShapes()` using modulo step `((pasteCounter - 1) % 10) + 1` and added `resetPasteCount()`.
- **Rationale:** Prevents pasted shapes from escalating infinitely off-screen during rapid sequential paste actions.

## Cycle 5: User Interaction & Canvas Hit-Testing (Category E)
- **Decision:** Updated `VectorWorkspace.tsx` canvas hit-testing loop to skip invisible (`!visible`), locked (`locked`), or zero-opacity (`opacity <= 0`) nodes.
- **Rationale:** Prevents accidental canvas selection of hidden or locked background elements.
