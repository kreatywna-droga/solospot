# UI Components Reference — Web Factor Authoring Studio v1.1 (Sprint S3)

## Overview

Sprint S3 introduces the React Interactive UI Component Framework inside `packages/authoring-studio/src/ui/components/`.

All components consume public APIs of frozen domain packages (PM35–PM48) exclusively.

---

## Component Inventory

### 1. Workspace Shell (`shell/`)
- `StudioShell`: Root studio container binding active layout model and dark theme theme mode
- `WorkspaceHost`: Workspace host component providing primary toolbar, status bar, and dock layout host
- `DockLayoutHost`: Renders split view dock nodes and tabbed panel headers
- `PanelHost`: Individual panel container with title bar and close action button

### 2. Timeline UI (`timeline/`)
- `TimelineCanvas`: Complete animation timeline canvas container
- `TimelineRuler`: Time ruler displaying duration and zoom markers
- `TimelinePlayhead`: Playhead indicator showing current timeline position
- `TimelineTrackView`: Property track row displaying keyframe clips
- `TimelineSelectionOverlay`: Overlay displaying active keyframe selection count

### 3. Inspector UI (`inspector/`)
- `PropertyInspector`: General node property inspector panel (PM35 API)
- `AnimationInspector`: Animation timeline and keyframe easing panel (PM35 API)
- `MultiSelectionInspector`: Batch selection inspector panel

### 4. Preview UI (`preview/`)
- `PreviewCanvas`: Stage viewport canvas area (PM38 API)
- `PreviewControls`: Viewport scale controls (50%, 100%, 150%)
- `PlaybackToolbar`: Transport controls toolbar (Play, Pause, Seek 0) (PM37 API)

### 5. Assets UI (`assets/`)
- `AssetBrowserPanel`: Asset registry browser grid (PM42 API)
- `AssetSearchPanel`: Filter input for asset tags and names
- `AssetCollectionsView`: Asset collections list (Favorites, Recently Used, Shared Team)

### 6. Command Palette UI (`command/`)
- `GlobalSearch`: Global command search input field
- `QuickActions`: Quick action trigger buttons (Quick Save, Quick Export, Cloud Sync)
- `CommandPaletteDialog`: Overlay dialog container for global command palette
