# G1-29 Architecture Decision — Vector Document Lifecycle, Persistence, Recovery & Clipboard

## 1. Document Ownership
`VectorWorkspaceState` (managed via React container `VectorWorkspace.tsx` or pure controller state) owns the `VectorDocumentSnapshot`.

## 2. Document Mutation
Only pure state transformer functions in `VectorWorkspaceController.ts` are permitted to mutate document snapshots.

## 3. Snapshot Creation
Immutable `VectorDocumentSnapshot` objects (`{ readonly nodes, readonly selectedIds }`) are created by domain engines (`VectorEditingEngine`, `VectorBooleanEngine`, `VectorClipboardEngine`) and wrapped by `VectorWorkspaceController`.

## 4. Document Serialization
`VectorDocumentSerializer.serializeVectorDocument(snapshot, metadata?)` converts snapshots into versioned JSON payload DTOs (`version: 1`).

## 5. Data Validation
`VectorDocumentSerializer.restoreVectorDocument(jsonString)` performs strict schema validation, type checks, geometry normalization (non-negative bounds, finite coordinates), fill/stroke fallbacks, and ID deduplication.

## 6. Document Restoration
`VectorWorkspaceController.loadVectorDocument(state, jsonString)` validates payloads via `restoreVectorDocument`, returns a restored state with a clean `HistoryStack`, and prunes invalid selection IDs.

## 7. HistoryStack during SAVE
Saving a document marks `lastSavedIndex = state.historyStack.currentIndex` without clearing history entries, allowing ongoing undo/redo.

## 8. HistoryStack during LOAD
Loading a new document initializes a fresh, isolated `HistoryStack` starting at index 0 (`'Initial State'`) to prevent history leaking across different documents.

## 9. Selection during LOAD
Selection IDs are restored from payload if valid, and automatically filtered against the restored node tree to prevent stale/ghost selection IDs.

## 10. Rendering during LOAD
`VectorRenderingBridge.buildRenderCommands(node)` compiles the newly restored node tree immediately upon state change, outputting updated `RendererCommand[]` for `CanvasRenderer`.

## 11. Clipboard Architecture
Pure TypeScript `VectorClipboardEngine` (`copyShapes`, `cutShapes`, `pasteShapes`) manages in-memory `VectorClipboardPayload` DTOs without browser DOM dependencies.

## 12. ID Generation
ID generation uses base36 timestamps combined with crypto/random suffixes (`shape_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`).

## 13. ID Collision Prevention
During paste, `VectorClipboardEngine` recursively maps all root and nested child node IDs to fresh, collision-safe unique IDs.

## 14. Undo after Paste
Undoing after paste pops the `'Paste Nodes'` snapshot, restoring the node tree and selection set to pre-paste state.

## 15. Redo after Paste
Redoing after paste restores the pasted nodes with their generated unique IDs and spatial offsets.

## 16. Error Behavior on Restore Failure
If `restoreVectorDocument` encounters malformed JSON or invalid schema, it returns `{ success: false, error: string }`. `loadVectorDocument` catches this and safely returns the input state unchanged.

## 17. Rollback Strategy
All controller dispatchers use atomic `try...catch` boundaries. Failure during load, paste, or restoration cleanly returns original input state.

## 18. Transaction Boundary
The transaction boundary encompasses input validation → node mutation → snapshot creation → `HistoryStack.push`.
