# G1-56 Transaction Model

## Transaction Principles
1. **Single Commit Per UI Dispatch**: Mutating visual canvas dispatches (`dispatchUISectionInsert`, `dispatchUISectionDelete`, `dispatchUISectionReorder`, `dispatchUISectionDuplicate`, `dispatchUIBlockContentUpdate`, `dispatchUIEcommerceProductBind`) commit exactly 1 `HistoryStack` entry.
2. **Zero Commit on Preview & Viewport Switching**: `dispatchUIBreakpointSwitch`, `renderInteractiveSectionOverlay`, and `exportCanvasPreviewHtml` commit 0 `HistoryStack` entries.
3. **Rollback Safety**: Failures restore initial `CanvasRuntimeSession` without memory leaks or partial commits.
