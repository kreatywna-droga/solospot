# Professional Media Workflow Architecture — Sprint S15

## Overview

Sprint S15 introduces the **Professional Asset & Media Workflow** for the Authoring Studio. It enables multi-format media imports (images, SVGs, fonts, audio, video), sequential asset processing pipelines, canvas object placement, unified asset browser UX, headless media previews, missing asset relinking, and strict `BuilderDocument` reference binding.

---

## Architectural Principles

1. **Single Source of Truth (SSOT)**: `BuilderDocument` remains the sole Single Source of Truth (`DECISION-044`).
2. **Lightweight Reference Binding**: Full binary payloads reside inside `AssetRegistryState` / `AssetStorage`. `BuilderDocument` nodes store light `assetId` references only.
3. **Headless Domain Core**: All media import, validation, metadata extraction, waveform generation, and relinking logic are pure TypeScript classes operating without browser or DOM dependencies.
4. **Zero Duplicate Asset Registries**: Reuses and extends `packages/authoring-studio/src/assets/AnimationAssetRegistry.ts`.

---

## Data & Command Protocol

```
Import / Drag & Drop
        ↓
MediaImportEngine (AssetID Generation)
        ↓
AssetProcessingPipeline (Validation & Metadata Extraction)
        ↓
AssetRegistryState (Metadata Entry)
        ↓
CanvasAssetPlacementEngine (BuilderDocument Node + AssetReference Link)
        ↓
AssetDocumentSyncBridge
        ↓
RenderingEngine / CanvasRenderer (Dynamic Asset Resolution)
```

---

## Core Components

- **`MediaImportEngine.ts`**: Single, batch, and drag-and-drop media file classification and stable `AssetID` generation.
- **`AssetProcessingPipeline.ts`**: Pipeline stages (`Import -> Validation -> Metadata Extraction -> Asset Registry -> Preview/Thumbnail -> Project Reference`).
- **`CanvasAssetPlacementEngine.ts`**: Handles canvas node creation, asset replacement, scaling with aspect ratio locks, cropping, fit modes (`contain`, `cover`, `fill`, `none`), and node duplication.
- **`AssetBrowserPanel.tsx`**: Unified UI component supporting search, category filters (`image`, `svg`, `font`, `audio`, `video`, `custom`), grid/list modes, favorites, and recent assets.
- **`AssetDocumentSyncBridge.ts`**: Coordinates 2-way reactivity between Asset Registry, AssetIDs, and `BuilderDocument` nodes.
- **`HeadlessMediaPreviewEngine.ts`**: Headless generation of image preview descriptors, SVG vector metadata, audio waveform amplitude arrays ($N$ bars), and video thumbnail descriptors.
- **`AssetRelinkEngine.ts`**: Scans for missing asset references, generates dependency reports, and executes single/global asset relinking.
