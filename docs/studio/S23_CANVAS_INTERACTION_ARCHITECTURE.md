# Sprint S23 — Professional Canvas Interaction & Navigation Architecture

## Architecture Overview

Sprint S23 establishes the **Professional Canvas Interaction & Navigation System** for Web Factor Authoring Studio. It bridges S21 (Camera & Viewport System) and S22 (Selection, Transform & History System) into a cohesive closed interaction pipeline without introducing duplicate domain engines or secondary single sources of truth (SSOT).

```
Screen Space
      ↓
InteractionCoordinateMapper (S21/S22)
      ↓
World Space
      ↓
CanvasSelectionController / CanvasSnappingController / CanvasNavigationController (S23)
      ↓
TransformInteractionEngine / LayerOperationsEngine (S19/S22)
      ↓
HistoryStack<BuilderDocument> (builder-core)
      ↓
BuilderDocument (SSOT)
```

---

## Key Modules

### 1. Canvas Navigation (`CanvasNavigationController.ts`)
- Pure headless controller providing `zoom`, `pan`, `zoomToCursor`, `fitToContent`, `fitToSelection`, `resetViewport`, `centerSelection`.
- Delegates directly to `CameraOperationsEngine` (S21).

### 2. Canvas Selection UX (`CanvasSelectionController.ts`)
- Pure headless controller providing marquee drag selection, additive selection (Shift), subtractive selection (Alt/Cmd), selection persistence, `selectAll`, `deselectAll`, `groupSelection`, `ungroupSelection`.
- Delegates directly to `SelectionManager` (S22) and `LayerOperationsEngine` (S19).

### 3. Canvas Snapping (`CanvasSnappingController.ts`)
- Orchestrates grid snapping, object snapping (edges & centers), edge snapping, center snapping, user guide snapping, and configurable snap tolerance threshold (1px–20px).

### 4. Guides & Rulers (`GuidesRulersModel.ts` & `GuidesRulersController.ts`)
- Headless model for user guide lines (`UserGuide`) and viewport rulers (`RulerConfig`, `RulerTick`).
- Calculates dynamic ruler tick scaling based on camera zoom and calculates smart guide alignment lines and gap distance indicators.

### 5. Keyboard Interaction (`CanvasKeyboardInteractionHandler.ts`)
- Pure headless keyboard event handler providing:
  - 1px Arrow Nudging & 10px Shift-nudging
  - Modifier-based transform constraints (`Shift` for aspect ratio lock, `Alt` for center scaling)
  - Shortcuts: `Ctrl+D` (Duplicate), `Delete`/`Backspace` (Delete), `Ctrl+G` (Group), `Ctrl+Shift+G` (Ungroup), `Ctrl+A` (Select All), `Escape` (Deselect All)
  - Align & Distribute keyboard command triggers (`Ctrl+Alt+L/C/R/T/M/B/H/V`)

### 6. Closed Coordinate Pipeline (`CanvasInteractionPipeline.ts`)
- Orchestrates the 5-step closed interaction loop: `Screen Space -> InteractionCoordinateMapper -> World Space -> Selection/Transform -> HistoryStack -> BuilderDocument`.

### 7. UI Adapter Layer (`RulersOverlay.tsx`, `GuidesOverlay.tsx`, `CanvasInteractionViewport.tsx`)
- React components rendering rulers, guides, selection bounding box, marquee box, and floating zoom controls while delegating pure interaction logic to the underlying controllers.
