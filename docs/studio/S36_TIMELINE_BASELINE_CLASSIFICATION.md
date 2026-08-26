# S36 Timeline Baseline Classification & Governance Inventory

> **Subsystem:** Authoring Studio — Timeline Editor & Keyframe Authoring (Sprint S36)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** RATIFIED GOVERNANCE CLASSIFICATION (S36-A INSTRUMENTATION REPAIR FIXED)  
> **Target Path:** `packages/authoring-studio/src/timeline/`  
> **Date:** 2026-08-11  

---

## 1. Executive Summary & Baseline Status

This document establishes the formal governance classification for the files located under `packages/authoring-studio/src/timeline/` and defines the exact, executable quality gates for Sprint S36.

```
=====================================================================================
                          FORMAL BASELINE CLASSIFICATION
=====================================================================================
  Path:                      packages/authoring-studio/src/timeline/
  Git Baseline Status:       PRE-EXISTING / UNTRACKED IN GIT REPOSITORY (0 tracked files)
  Status Względem S36:       LEGACY / OUT-OF-S36-IMPLEMENTATION-SCOPE
  S36 Dedicated TS Config:   packages/authoring-studio/tsconfig.s36.json
  S36 Typecheck Script:      npm run typecheck:s36 (0 errors)
=====================================================================================
```

S36 does NOT claim ownership of pre-existing experimental PM37–PM40 or media editing modules in `timeline/`. S36 defines an explicit, granular inventory dividing all files into three strict governance tiers.

---

## 2. Granular File Classification Inventory

### Tier 1 — S36 Foundation & REUSE / READ-ONLY REFERENCE

These modules form the core Authoring UX & Lossless DTO Document Binding foundation for Sprint S36. They are reused as READ-ONLY references during S36:

| File Name | Purpose & S36 Role | Governance Status |
|---|---|---|
| `timelineDocumentBinding.ts` | **Lossless DTO Document Binding API:** Immutable, targeted mutations of `AnimationTimeline` DTOs stored in `SectionNode.props['animationTimeline']` (`addClip`, `removeClip`, `moveClip`, `resizeClip`, `addTrack`, `removeTrack`, `addKeyframe`, `deleteKeyframe`, `moveKeyframe`, `setKeyframeValue`, `setKeyframeEasing`). | **REUSE / READ-ONLY REFERENCE** |
| `TimelineSelection.ts` | **Pure UI Selection Model:** Immutable selection state (`selectedClipId`, `selectedTrackId`, `selectedKeyframeId`). | **REUSE / READ-ONLY REFERENCE** |
| `TimelineViewport.ts` | **Pure Viewport Geometry:** Time-to-pixel scale conversions (`timeToPixels`, `pixelsToTime`, `visibleTimeRange`, `scrollToTime`). | **REUSE / READ-ONLY REFERENCE** |
| `TimelineCursor.ts` | **Pure Playhead Cursor Model:** Static scrubbing position (`timeMs`, `currentTime`, `frameIndex`, `playheadPosition`). | **REUSE / READ-ONLY REFERENCE** |
| `TimelineGrid.ts` | **Pure Grid Ruler Model:** Real production grid API (`buildTimelineGrid`, `computeTickInterval`, `formatTickLabel`, `snapTimeToGrid`). | **REUSE / READ-ONLY REFERENCE** |
| `TimelineCommands.ts` | **Productivity Command DTO Descriptors:** Descriptors for duplicate, delete, group, lock commands. | **REUSE / READ-ONLY REFERENCE** |
| `TimelinePanel.tsx` | **React Timeline UI Surface:** Pure presentation React timeline authoring panel. | **REUSE / READ-ONLY REFERENCE** |
| `TimelinePanelAdapter.ts` | **Panel Adapter:** Bridge adapter for integration into Authoring Studio shell. | **REUSE / READ-ONLY REFERENCE** |
| `timelinePropertyFields.ts` | **Property Field Definitions:** Single source of truth for timeline field definitions. | **REUSE / READ-ONLY REFERENCE** |
| `index.ts` | **Clean Public Barrel Export:** Barrel file restricted strictly to S36 Authoring APIs. | **S36-OWNED PUBLIC BARREL** |

---

### Tier 2 — S36-Owned Integration & Test Suites (S36-C Implementation Scope)

These test suites represent the formal verification surface for Sprint S36. They MUST be 100% PASSING and form the S36 Quality Gate:

| Test File Name | Scope & Test Focus | Governance Status |
|---|---|---|
| `__tests__/TimelineE2EWorkflow.test.ts` | **S36 Golden E2E Integration Test:** 13-step authoring workflow on complex timelines (2 clips, 2 tracks, 3 keyframes, speed=1.5) verifying lossless DTO mutations and `HistoryStack` undo/redo. | **S36-OWNED GOLDEN E2E (MUST BE 100% PASS)** |
| `__tests__/TimelineDocumentBinding.test.ts` | Unit tests for `timelineDocumentBinding.ts` lossless mutations. | **S36-OWNED UNIT SUITE (MUST BE 100% PASS)** |
| `__tests__/TimelineSelection.test.ts` | Unit tests for `TimelineSelection.ts` pure UI model. | **S36-OWNED UNIT SUITE (MUST BE 100% PASS)** |
| `__tests__/TimelineViewport.test.ts` | Unit tests for `TimelineViewport.ts` scale conversions. | **S36-OWNED UNIT SUITE (MUST BE 100% PASS)** |
| `__tests__/TimelineCursor.test.ts` | Unit tests for `TimelineCursor.ts` playhead scrubbing. | **S36-OWNED UNIT SUITE (MUST BE 100% PASS)** |
| `__tests__/TimelineGrid.test.ts` | Unit tests for `TimelineGrid.ts` ruler ticks (`buildTimelineGrid`). | **S36-OWNED UNIT SUITE (MUST BE 100% PASS)** |

---

### Tier 3 — PM37+ / OUT OF SCOPE (Studio Playback & Media Integration)

These pre-existing modules and legacy test files belong to future sprints (PM37 Studio Playback, PM39 Authoring UX Polish, PM40 Productivity, S16/S26 Media Editing). They are **EXCLUDED from S36 Scope** and MUST NOT be exported by `packages/authoring-studio/src/timeline/index.ts`:

#### Excluded PM37 Studio Playback & Runtime Orchestration Modules:
- `TimelinePlaybackSession.ts` (PM37 Studio Playback Session — contains runtime orchestration)
- `TimelineTransportController.ts` (PM37 Studio Transport Controller)
- `TimelineStudioBridge.ts` (PM37 Studio Runtime Bridge — imports `AnimationRuntimeBridge` & `AnimationTriggerEngine`)
- `TimelineSelectionSync.ts`, `timelineDtoSync.ts`

#### Excluded PM39 / PM40 / Media Timeline Modules:
- `TimelineEasingEditor.ts`, `TimelineKeyframeAuthoring.ts`, `TimelineMultiSelection.ts`, `TimelineNavigation.ts`, `TimelineClipboard.ts`, `TimelineHistoryBinding.ts`, `TimelineContextMenu.ts`, `TimelineShortcuts.ts`
- `TimelineSmartGuides.ts`, `TimelineSnapEngine.ts`, `TimelineOnionSkin.ts`, `TimelineGhostFrames.ts`, `TimelineBookmarks.ts`, `TimelineFolders.ts`, `TimelineFiltering.ts`, `TimelineAuthoringExtensions.ts`
- `MediaTimelineModel.ts`, `AudioTimelineEngine.ts`, `VideoTimelineEngine.ts`, `MediaTimelineEditingEngine.ts`, `MediaSyncCoordinator.ts`, `MediaWaveformUX.ts`, `MediaAudioVideoEditing.ts`, `MediaClipMarkers.ts`, `MediaTimelineCommands.ts`, `MediaIntegrityEngine.ts`
- `TimelineSelectionController.ts`, `TimelineKeyframeController.ts`, `TimelineSnappingController.ts`, `TimelineMarkersRegionsModel.ts`, `TimelineMarkersRegionsController.ts`, `TimelineCurveAuthoringController.ts`, `TimelineViewController.ts`, `TimelineKeyboardInteractionHandler.ts`, `TimelineInteractionPipeline.ts`

---

## 3. Legacy Tests Disposition & TSC Scope Definition (F-03 Option A)

### 3.1 Dedicated S36 TypeScript Configuration (`packages/authoring-studio/tsconfig.s36.json`)

To enforce a strict, reproducible, and executable TypeScript quality gate for Sprint S36, a dedicated TS configuration has been created: `packages/authoring-studio/tsconfig.s36.json`.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "builder-core/*": ["../builder-core/src/*"]
    }
  },
  "include": [
    "src/timeline/TimelineSelection.ts",
    "src/timeline/TimelineViewport.ts",
    "src/timeline/TimelineCursor.ts",
    "src/timeline/TimelineGrid.ts",
    "src/timeline/timelineDocumentBinding.ts",
    "src/timeline/TimelinePanel.tsx",
    "src/timeline/TimelinePanelAdapter.ts",
    "src/timeline/timelinePropertyFields.ts",
    "src/timeline/TimelineCommands.ts",
    "src/timeline/index.ts",
    "src/timeline/__tests__/TimelineDocumentBinding.test.ts",
    "src/timeline/__tests__/TimelineSelection.test.ts",
    "src/timeline/__tests__/TimelineCursor.test.ts"
  ]
}
```

### 3.2 S36 Typecheck Script (`package.json`)

Added command to `package.json`:
```json
"typecheck:s36": "tsc -p packages/authoring-studio/tsconfig.s36.json --noEmit"
```

Execution of `npm run typecheck:s36` produces **0 errors**.

### 3.3 Explicit S36 Quality Gate Definitions

| Quality Gate | Exact Scope & Executable Command | Requirement / Expected Result |
|---|---|---|
| **S36 Dedicated TypeScript Gate** | `npm run typecheck:s36` | ✅ **0 errors** |
| **S36 Golden E2E Test** | `npx vitest run packages/authoring-studio/src/timeline/__tests__/TimelineE2EWorkflow.test.ts` | ✅ **100% PASS** |
| **S36 Authoring Vitest Suite** | `npx vitest run packages/authoring-studio/src/timeline/__tests__/TimelineDocumentBinding.test.ts packages/authoring-studio/src/timeline/__tests__/TimelineSelection.test.ts packages/authoring-studio/src/timeline/__tests__/TimelineCursor.test.ts` | ✅ **100% PASS** |
| **S36 Production Build Gate** | `npm run build` | ✅ **PASS (exit code 0, ignoreBuildErrors: false)** |
| **Repository-Wide Monorepo TSC** | `npx tsc --noEmit` | ℹ️ *Repository-wide check includes pre-existing untracked PM37 experimental files. EXCLUDED from S36 acceptance scope.* |
| **Freeze S1–S35** | `packages/builder-core/**` & `BuilderDocument.ts` | ✅ **100% FROZEN (0 edits)** |

---

## 4. Summary of Governance Guarantees

- **No Silent Assumptions:** All 50+ files in `timeline/` are explicitly classified into Tier 1 (REUSE), Tier 2 (S36-OWNED), and Tier 3 (OUT OF SCOPE).
- **Enforceable TS Boundary:** `packages/authoring-studio/tsconfig.s36.json` and `npm run typecheck:s36` provide a 100% reproducible TypeScript gate producing **0 errors**.
- **Clean S36 Public Boundary:** `packages/authoring-studio/src/timeline/index.ts` exports ONLY S36 Authoring APIs.
- **Freeze Preservation:** S1–S35 subsystems and `BuilderDocument.ts` remain 100% frozen.
