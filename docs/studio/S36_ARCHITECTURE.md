# S36 Architecture Specification — Timeline Editor & Keyframe Authoring

> **Subsystem:** Authoring Studio — Timeline Editor & Keyframe Authoring (Sprint S36)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — REVISED ARCHITECTURE (S36-A REPAIR CYCLE FIXED)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `SectionNode`, `AnimationTypes`, `AnimationTimeline`, `AnimationClip`, `PropertyAnimationTrack`, `AnimationKeyframe`, `EasingCurve`, `HistoryStack`), S28 Responsive, S29 Layout, S30 Layout Inspector, S31 Viewport Preview, S32 Components, S33 Triggers, S34 Runtime Preview, S35 Inspector Animation Panel (`../inspector/animationDocumentBinding`)

---

## 1. Executive Summary & Core Objective

Sprint S36 delivers the **Timeline Editor & Keyframe Authoring subsystem** within Authoring Studio (`packages/authoring-studio/src/timeline/`). It provides a comprehensive, interactive authoring UX and domain mutation layer for editing animation timelines, clips, property tracks, keyframes, easing curves, and selection state on `BuilderDocument` SSOT (`node.props['animationTimeline']`).

S36 answers the fundamental architectural question:

> *"How does the Authoring Studio Timeline Editor manage interactive timeline selection, viewport scrubbing, grid snapping, and granular keyframe/clip/track mutations on BuilderDocument SSOT without creating second document stores, without introducing duplicate history stacks, and without flattening or destroying complex timeline structures during single-element edits?"*

S36 **is not** an Animation Engine, Playback Engine, Scheduler, or Canvas Renderer. It establishes a strict, decoupled boundary:

1. **Pure Authoring UX Models (`TimelineSelection`, `TimelineViewport`, `TimelineCursor`, `TimelineGrid`):** Immutable UI models representing selection state, time-to-pixel conversions, playhead scrubbing position, and grid ruler tick snapping.
2. **Single Source of Truth (SSOT) Document Binding (`timelineDocumentBinding.ts`):** Declarative, immutable mutation functions performing targeted, lossless updates on `AnimationTimeline` DTOs stored under `node.props['animationTimeline']` on `BuilderDocument`.
3. **Hard Lossless Preservation Rule (DECISION-047 / S36 Rule):** Single-element editing operations (e.g. updating a single keyframe value, moving a keyframe, or changing easing) MUST NOT flatten or reconstruct the timeline from a simplified DTO. All multi-clip, multi-track, multi-keyframe, and custom playback options (`speed`) are 100% preserved.

---

## 2. Architecture & Subsystem Boundary Flow

```
+-----------------------------------------------------------------------------------+
|                           BuilderDocument (SSOT)                                  |
|   node.props['animationTimeline'] -> AnimationTimeline DTO (Immutable Config)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Inspects DTO)
+-----------------------------------------------------------------------------------+
|      inspectNodeAnimation(doc, nodeId) -> AnimationTimeline                        |
|      (packages/authoring-studio/src/inspector/animationDocumentBinding.ts)       |
+-----------------------------------------------------------------------------------+
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
[ Pure Authoring UX Models ]                       [ Lossless Document Mutations ]
- TimelineSelection (clip/track/kf ID)             - addClip / removeClip / moveClip / resizeClip
- TimelineViewport (width, pixelsPerMs)            - addTrack / removeTrack
- TimelineCursor (timeMs, playheadPosition)        - addKeyframe / moveKeyframe / deleteKeyframe
- TimelineGrid (buildTimelineGrid, snapping)       - setKeyframeValue / setKeyframeEasing
                                         │
                                         ▼ (Returns NEW BuilderDocument snapshot)
+-----------------------------------------------------------------------------------+
|                    createHistoryStack<BuilderDocument>()                          |
|    Canonical HistoryStack.push(newDoc, label) -> enables undo / redo              |
+-----------------------------------------------------------------------------------+

=====================================================================================
STRICT BOUNDARY (DECISION-047 / DECISION-068) — NO RUNTIME EXECUTION IN TIMELINE UX
   ❌ NO PlaybackController    ❌ NO RuntimeScheduler        ❌ NO requestAnimationFrame
   ❌ NO Trigger Engine Run    ❌ NO Canvas Renderer         ❌ NO Secondary HistoryStack
   ❌ NO TimelinePlaybackSession (PM37)                      ❌ NO TimelineStudioBridge (PM37)
=====================================================================================
```

---

## 3. Governance & Architectural Decisions

### DECISION-047 — Lossless Timeline DTO Patching Rule
- Single-element timeline operations (editing keyframe value, moving keyframe, changing easing) MUST perform targeted, immutable patches on the existing `AnimationTimeline` DTO.
- **CRITICAL RULE:** No operation may flatten `AnimationTimeline` into simplified DTOs or rebuild it from scalar fields. All multi-clip, multi-track, multi-keyframe, and custom playback options (`speed`) must remain 100% preserved.

### DECISION-048 — Pure UI Authoring Models & Real Grid API
- UI models (`TimelineSelection`, `TimelineViewport`, `TimelineCursor`, `TimelineGrid`) are strictly pure, immutable data models representing authoring state.
- **Real Grid API (F-01 Fix):** Ruler grid construction uses real production exports `buildTimelineGrid(viewport)`, `computeTickInterval(viewport)`, `formatTickLabel(timeMs)`, and `snapTimeToGrid(viewport, timeMs)`. No phantom `calculateGridTicks` API exists.

### DECISION-049 — Single Source of Truth (SSOT) Persistence
- `BuilderDocument` is the single source of truth for all timeline data (`node.props['animationTimeline']`).
- The Timeline Editor NEVER stores an independent copy or secondary store of animation data.

### DECISION-050 — Canonical History Stack Integration
- Every clip, track, keyframe, or easing mutation produces a NEW `BuilderDocument` snapshot.
- Document updates are pushed to the caller-provided `createHistoryStack<BuilderDocument>()` using human-readable command labels (e.g. `'Move Keyframe'`, `'Set Keyframe Easing'`).

### DECISION-051 — Strict S36 Public Boundary (F-04 Fix)
- S36 public barrel file (`packages/authoring-studio/src/timeline/index.ts`) exports ONLY S36 Authoring APIs.
- PM37 runtime orchestration modules (`TimelinePlaybackSession`, `TimelineTransportController`, `TimelineStudioBridge`) are EXCLUDED from the S36 public API surface.

---

## 4. Subsystem Contracts & Production Inventory (`packages/authoring-studio/src/timeline/`)

### 4.1 S36 Production Modules

| Module File | Role & Responsibilities | Status |
|---|---|---|
| `timelineDocumentBinding.ts` | Lossless document mutation API: `addClip`, `removeClip`, `moveClip`, `resizeClip`, `addTrack`, `removeTrack`, `addKeyframe`, `deleteKeyframe`, `moveKeyframe`, `setKeyframeValue`, `setKeyframeEasing`, `getClip`, `getTrack`, `getKeyframe`. | S36-Owned / Lossless DTO |
| `TimelineSelection.ts` | Pure UI selection model (`selectedClipId`, `selectedTrackId`, `selectedKeyframeId`, `selectClip`, `selectTrack`, `selectKeyframe`, `clearSelection`). | S36-Owned UI Model |
| `TimelineViewport.ts` | Viewport geometry and time-to-pixel scale conversions (`timeToPixels`, `pixelsToTime`, `visibleTimeRange`, `scrollToTime`). | S36-Owned UI Model |
| `TimelineCursor.ts` | Pure playhead cursor position model (`timeMs`, `currentTime`, `frameIndex`, `playheadPosition`, `moveCursor`, `clampCursorToDuration`). | S36-Owned UI Model |
| `TimelineGrid.ts` | Grid ruler snapping and tick calculations (`buildTimelineGrid`, `computeTickInterval`, `formatTickLabel`, `snapTimeToGrid`). | S36-Owned UI Model |
| `TimelineCommands.ts` | Productivity command DTO descriptors (`DuplicateCommand`, `DeleteCommand`, `GroupCommand`, `LockCommand`). | S36-Owned Command DTO |
| `TimelinePanel.tsx` | Pure React timeline authoring UI surface for clips, tracks, keyframes, and playhead. | S36-Owned UI Surface |
| `index.ts` | Clean public barrel export restricted strictly to S36 Authoring APIs. | S36 Public Barrel |

### 4.2 Reused Subsystem APIs

1. **`builder-core` (`packages/builder-core/src/`):**
   - `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode`, `createHistoryStack`, `HistoryStack`
   - `AnimationTimeline`, `AnimationClip`, `PropertyAnimationTrack`, `AnimationKeyframe`, `EasingCurve`, `PlaybackOptions`
2. **S35 Inspector Binding (`packages/authoring-studio/src/inspector/`):**
   - `inspectNodeAnimation`, `applyAnimationToNode`, `findNodeById`, `updateNodeById`

---

## 5. Dependency Graph & Boundary Constraints

### 5.1 Permitted Imports
- `../../../builder-core/src/BuilderDocument`
- `../../../builder-core/src/animation/AnimationTypes`
- `../../../builder-core/src/HistoryStack`
- `../inspector/animationDocumentBinding`

### 5.2 Strict Prohibitions (Forbidden Imports & Symbols)
- ❌ NO `PlaybackController` / `AnimationPlaybackController`
- ❌ NO `RuntimeScheduler`
- ❌ NO `AnimationTriggerEngine` execution (`shouldStart`, `transition`)
- ❌ NO `AnimationRuntimeBridge` / `AnimationRuntimePreviewBridge`
- ❌ NO `BrowserTriggerAdapter`
- ❌ NO `requestAnimationFrame`, `setTimeout`, `setInterval`
- ❌ NO Secondary document stores or custom history stacks
- ❌ NO Rebuilding timeline from simplified DTOs (Flatten -> Rebuild)
- ❌ NO PM37 modules (`TimelinePlaybackSession`, `TimelineStudioBridge`) in S36 barrel

---

## 6. SSOT & Lossless Persistence Model

| Data Element | Storage Location | Persistence | Mutability |
|---|---|---|---|
| `AnimationTimeline` (DTO) | `node.props['animationTimeline']` in `BuilderDocument` | Persistent (Saved to JSON / SSOT) | Immutable (Lossless targeted patch via `timelineDocumentBinding.ts`) |
| Selection State | `TimelineSelection` object | Transient (Authoring session UI state) | Immutable UI snapshot |
| Viewport Geometry | `TimelineViewport` object | Transient (Authoring session UI state) | Immutable UI snapshot |
| Playhead Position | `TimelineCursor` object | Transient (Authoring session UI state) | Immutable UI snapshot |
| History Stack Entries | `createHistoryStack<BuilderDocument>()` | Memory stack | Immutable snapshots pushed on mutation |

---

## 7. Golden E2E Verification Workflow (`TimelineE2EWorkflow.test.ts`)

The Golden E2E Integration Workflow verifies the full timeline authoring lifecycle across complex timelines:

```
 1. Create BuilderDocument & SectionNode via canonical production factories.
 2. Attach complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes, playback speed = 1.5) to node.props['animationTimeline'].
 3. Initialize HistoryStack<BuilderDocument>() and TimelineSelection model.
 4. Select keyframe via selectKeyframe(selection, clipId, trackId, keyframeId).
 5. Modify keyframe value via setKeyframeValue(doc1, nodeId, clipId, trackId, keyframeId, 0.75) -> returns doc2.
 6. Modify keyframe easing via setKeyframeEasing(doc2, nodeId, clipId, trackId, keyframeId, { type: 'cubic-bezier', controlPoints: [0.4, 0, 0.2, 1] }) -> returns doc3.
 7. Add new keyframe via addKeyframe(doc3, nodeId, clipId, trackId, newKf) -> returns doc4.
 8. Move keyframe via moveKeyframe(doc4, nodeId, clipId, trackId, keyframeId, 750) -> returns doc5.
 9. Resize clip via resizeClip(doc5, nodeId, clipId, 2000) -> returns doc6.
10. Push snapshots onto HistoryStack<BuilderDocument>.
11. Execute history.undo() -> verify document reverts snapshot by snapshot.
12. Execute history.redo() -> verify document restores doc6 state.
13. VERIFY LOSSLESS PRESERVATION: all 2 clips, 2 tracks, keyframes, and speed = 1.5 remain 100% intact throughout all mutations.
```

---

## 8. Summary of Architectural Guarantees

- **0 Phantom APIs:** Uses real production grid API `buildTimelineGrid(viewport)` (F-01 Fix).
- **0 Duplicate Engines:** 0 playback controllers, 0 schedulers, 0 renderers in S36 Timeline Editor.
- **Strict S36 Public Boundary:** PM37 runtime orchestration modules excluded from S36 barrel export (F-04 Fix).
- **0 Loss of Timeline Data:** Single-element edits perform lossless targeted DTO patching.
- **SSOT Integrity:** `BuilderDocument` (`node.props['animationTimeline']`) is preserved as single source of truth.
- **Freeze Preservation:** S1–S35 subsystems and `BuilderDocument.ts` remain 100% frozen.
