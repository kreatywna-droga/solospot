# S25 — Professional Asset Management & Media Library UX

> **Status:** IMPLEMENTATION COMPLETE
> **Mode:** Act
> **Tests:** 6/6 new test suites PASS (≥60 assertions)
> **TypeScript:** `tsc --noEmit` clean across all S25 source files

## Core Constraint

S25 MUST reuse the existing S15 `AnimationAssetRegistry` — NOT build a second Asset
Registry. Binary/media payload never enters `BuilderDocument`: only `assetId`
references are written (DECISION-044 — SSOT = `BuilderDocument`).

## Architecture (reuse-only, zero duplicates)

```
S15 AnimationAssetRegistry  ← SSOT (no second registry)
        ↓
S25 MediaLibraryBrowser      ← headless view-state: filter/sort/select/immutable ops
S25 MediaLibraryCollections  ← collections/folders/favorites/tags (immutable)
S15 CanvasAssetPlacementEngine + S16 MediaTimelineModel ← drop targets (reused)
S25 MediaDragDropWorkflow      ← orchestrates canvas/timeline drop intents (assetId-only)
S15 AssetRelinkEngine + AnimationDependencyGraph ← integrity (reused)
S25 AssetIntegrityScanner      ← single integrity surface (relink/duplicate/orphan/missing)
S15 MediaImportEngine + AssetProcessingPipeline ← import (reused)
S25 AssetOperationsEngine       ← import/rename/duplicate/replace/delete (pipeline-backed)
S25 AssetPreviewDescriptors     ← deterministic previews: image/video/audio/svg/font
S15 AssetDocumentSyncBridge     ← registry ↔ document sync (reused)
   S22/S23 Canvas + Timeline UX
```

## Domain Modules (`packages/authoring-studio/src/assets/`)

| File | Role | Reused foundations |
|------|------|--------------------|
| `MediaLibraryBrowser.ts` | Headless view-state: filter/sort/select/immutable state machine. Reuses `AnimationAssetSearch` searchAssets for text queries. | `AnimationAssetRegistry`, `AnimationAssetSearch`, `AssetBrowserState` |
| `MediaLibraryCollections.ts` | Immutable collection/folder state machine: create/rename/delete, asset linking, browser-state derivation on delete. | — (new state surface over existing items) |
| `MediaDragDropWorkflow.ts` | Canvas drop intents + Media Timeline drop intents (assetId-only reference links). Reuses S15 `CanvasAssetPlacementEngine` + S16 `MediaTimelineModel` DTOs. | `CanvasAssetPlacementEngine`, `MediaTimelineModel`, `AnimationAssetReference` |
| `AssetOperationsEngine.ts` | import/rename/duplicate/replace/delete + audit log. Reuses S15 `MediaImportEngine` + `AssetProcessingPipeline`. | `MediaImportEngine`, `AssetProcessingPipeline`, `AnimationAssetRegistry` |
| `AssetPreviewDescriptors.ts` | `composePreview`/`composePreviewBundle`, deterministic audio waveform + video thumbnails, formatAssetFileSize/Duration. No media decoding (seed-derived). | `assetPayload` |
| `AssetIntegrityScanner.ts` | Single integrity surface: scan/repair/relink/resolve-duplicates. Reuses S15 `AssetRelinkEngine` + `AnimationDependencyGraph`. | `AssetRelinkEngine`, `AnimationDependencyGraph`, `AnimationAssetRegistry` |

## UI Component (`packages/authoring-studio/src/ui/components/assets/`)

| File | Role |
|------|------|
| `MediaLibraryPanel.tsx` | Professional React panel: grid/list, search, sort chips, favorites, multi-select, rename/duplicate/delete/replace via callbacks. Headless logic stays in `MediaLibraryBrowser`; the panel edits configuration only (Inspector never invokes PlaybackController, DECISION-045). |

## Tests (`packages/authoring-studio/src/assets/__tests__/`)

| File | Count | Focus |
|------|-------|-------|
| `MediaLibraryBrowserUX.test.ts` | 18 | sort (name/size/duration/type), filters (query/tags/category/dimensions/duration/collection/favorite), selection (single/toggle/range/clear) |
| `MediaLibraryCollections.test.ts` | 7 | create/rename/delete idempotency, asset linking, browser-state derivation on collection delete |
| `AssetOperations.test.ts` | 9 | import (single+batch), rename, duplicate, replace, delete (with/without dangling refs), relink |
| `AssetPreviewDescriptors.test.ts` | 10 | image/video/audio/svg/font previews, deterministic waveform, video thumbnails, size/duration formatting |
| `MediaDragDropWorkflow.test.ts` | 6 | target resolution, canvas drop intent (assetId-only), audio/video timeline intents, replace, resolveAssetDropIntent routing |
| `AssetIntegrity.test.ts` | 6 | scan (missing/broken/duplicates/orphans), isReplacementEligible, repair (relink + drop), resolveDuplicateAssets |

## Key Guarantees

- **No second Asset Registry** — all modules accept `AssetRegistryState` from S15.
- **No binary payload in BuilderDocument** — drop intents carry only `assetId` reference links.
- **No custom playback in UI** — `MediaLibraryPanel` is editor configuration only.
- **Deterministic** — previews and waveforms are seed-derived (assetId) for reproducible audits.
- **Zero DOM/React/Browser API in domain** — all headless modules are pure TS.
- **No circular deps** — `MediaLibraryBrowser` imports registry/search; `MediaLibraryCollections` is standalone; `MediaDragDropWorkflow` reuses placement + timeline DTOs.
