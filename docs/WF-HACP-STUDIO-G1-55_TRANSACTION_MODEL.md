# G1-55 Transaction Model

## Transaction Principles
1. **Single Commit Per Operation**: Mutating visual page builder operations (`insertSection`, `deleteSection`, `reorderSection`, `duplicateSection`, `insertBlock`, `deleteBlock`, `updateBlockContent`, `updateSectionLayout`) commit exactly 1 `HistoryStack` entry.
2. **Zero Commit on Preview**: `previewCurrentComposition` and `exportCompositionHtml` commit 0 `HistoryStack` entries.
3. **Rollback Safety**: Failures restore the initial `VectorWorkspaceState` without memory leaks or partial commits.
