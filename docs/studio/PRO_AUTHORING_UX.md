# Professional Animation Authoring UX Architecture — Sprint S14

## Overview

Sprint S14 transforms the Authoring Studio into a professional animation environment by introducing interactive visual authoring tools without duplicating underlying evaluation or state engines.

All tools build directly upon the S10–S13 animation foundation (`RenderingEngine`, `CanvasRenderer`, `RealtimeEditingSession`, `AdvancedMotionCurves`, `Transform2DAnimation`, `MotionPathEvaluator`).

---

## Architectural Principles

1. **Single Source of Truth (SSOT)**: `BuilderDocument` remains the sole Single Source of Truth (`DECISION-044`).
2. **Zero Duplicate Evaluators**: All curve and motion evaluations delegate strictly to S13 `AdvancedMotionCurves` and `MotionPathEvaluator`.
3. **Pure Presentation & Command Dispatch**: User gestures on UI components emit commands to `BuilderDocument`, propagating reactively across Inspector, Timeline, Motion System, and Canvas.

---

## Core Components

- **Graph Editor (`GraphEditor.tsx` & `GraphEditorEngine.ts`)**: Value Graph & Speed Graph visualization with Bézier tangent handles, interpolation modes, zoom/pan, and multi-curve selection.
- **Motion Path Editor (`MotionPathEditor.tsx` & `MotionPathEditorEngine.ts`)**: Interactive spatial motion path overlay, waypoint handles, drag points, reverse path, split path, and live path preview.
- **Canvas Object Manipulation (`CanvasObjectManipulator.tsx` & `CanvasTransformGizmo.ts`)**: Bounding box transform handles for select, move, scale, rotate, resize, multi-select, alignment, and grid snapping.
- **Professional Timeline UX (`TimelinePanel.tsx` & `TimelineAuthoringExtensions.ts`)**: Easing indicators, track grouping, timeline markers, range selection, copy/paste keyframes, and ripple editing.
- **Onion Skin & Ghost Frames (`OnionSkinOverlay.tsx` & `TimelineOnionSkin.ts`)**: Translucent ghost frame overlays ($t \pm n\cdot\Delta t$) with opacity falloff and configurable range.
- **Bi-Directional Sync (`AuthoringStudioSyncBridge.ts`)**: 2-way live reactivity across Inspector ↔ Document ↔ Timeline ↔ Canvas.
- **Professional Shortcuts (`ProfessionalShortcutsHandler.ts`)**: Keybindings (`V`, `W`, `E`, `R`, `G`, `Space`, `Ctrl+D`, `Ctrl+Z`, `Ctrl+Shift+Z`).
