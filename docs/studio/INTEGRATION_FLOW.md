# Integration Flow Reference — Web Factor Authoring Studio v1.1 (Sprint S4)

## End-to-End User Flow Architecture

```
User Interaction (React UI — Sprint S3)
          │
          ▼
   ui/runtime/ (Sprint S4)
          │
    ┌─────┴──────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      ▼
TimelineRuntimeConnector              InspectorDocumentSync
(PM37 Transport + Session)            (BuilderDocument SSOT — DECISION-044)
    │                                       │
    ▼                                       ▼
PreviewRenderingBridge              CommandHistoryIntegration
(PM38 PlayheadSync)                 (PM39 TimelineHistoryBinding — DECISION-061)
    │                                       │
    └──────────────────┬────────────────────┘
                       │
                       ▼
             AssetPipelineIntegration
             (PM41 AnimationExportPipeline — DECISION-069)
                       │
                       ▼
             InteractiveUserFlows
             (PM44 ProjectPublisher — DECISION-085)
```

## Flow Steps

### 1. Create Animation → Edit Timeline
- `TimelineRuntimeConnector` connects `TimelineCanvas` to `TimelineTransportController` (PM37).
- Transport emits COMMAND objects (DECISION-051). No frame evaluation in UI layer.

### 2. Inspector Edit → SSOT Sync
- `InspectorDocumentSync.syncInspectorValueToSSOT()` calls `touchDocument()` on `BuilderDocument`.
- Inspector edits data only. Never invokes PlaybackController (DECISION-045).
- Single Source of Truth integrity guaranteed (DECISION-044, DECISION-100).

### 3. Preview Rendering
- `PreviewRenderingBridge.seekPreviewToTime()` delegates to `syncTimelinePlayheadToPreview()` (PM38).
- Loop prevention via atomic source tagging (`lastSource: 'timeline' | 'preview'`).

### 4. Undo / Redo
- `CommandHistoryIntegration.executeCommandWithUndo()` delegates to `executeTimelineTransaction()` (PM39).
- Full undo/redo stack backed by `HistoryStack<BuilderDocument>` (DECISION-061).

### 5. Export
- `AssetPipelineIntegration.exportAssetPackageFromUI()` delegates to `exportAnimationTimeline()` (PM41).
- Produces serialized JSON DTO package (DECISION-069).

### 6. Publish
- `InteractiveUserFlows.executeFullInteractiveUserFlow()` delegates to `publishProject()` (PM44).
- Produces publish manifest and release artifact (DECISION-085).
