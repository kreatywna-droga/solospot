# S36 Implementation Plan — Timeline Editor & Keyframe Authoring

> **Subsystem:** Authoring Studio — Timeline Editor & Keyframe Authoring (Sprint S36)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — REVISED IMPLEMENTATION PLAN (S36-A REPAIR CYCLE FIXED)  
> **Target Package:** `packages/authoring-studio` (`src/timeline/`)

---

## 1. Goal & Objectives

Deliver the **Timeline Editor & Keyframe Authoring** subsystem for Authoring Studio (`packages/authoring-studio/src/timeline/`). Provide interactive authoring UX and lossless DTO editing for animation timelines, clips, tracks, keyframes, and easing curves on `BuilderDocument` SSOT (`node.props['animationTimeline']`) with 0 DOM/runtime execution, 0 duplicate engines, 0 phantom APIs, and 100% integration with canonical `HistoryStack`.

---

## 2. Technical Implementation Scope

### Component 1: Lossless Document Binding (`packages/authoring-studio/src/timeline/`)
- **`timelineDocumentBinding.ts` (Existing / Verify):** Immutably updates `AnimationTimeline` DTOs under `node.props['animationTimeline']` via targeted, lossless operations (`addClip`, `removeClip`, `moveClip`, `resizeClip`, `addTrack`, `removeTrack`, `addKeyframe`, `deleteKeyframe`, `moveKeyframe`, `setKeyframeValue`, `setKeyframeEasing`).

### Component 2: Authoring UI State Models (`packages/authoring-studio/src/timeline/`)
- **`TimelineSelection.ts` (Existing / Verify):** Pure UI selection model (`selectedClipId`, `selectedTrackId`, `selectedKeyframeId`).
- **`TimelineViewport.ts` (Existing / Verify):** Viewport geometry and time-to-pixel scale calculations.
- **`TimelineCursor.ts` (Existing / Verify):** Pure playhead cursor scrubbing model.
- **`TimelineGrid.ts` (Existing / Verify):** Real production grid API (`buildTimelineGrid`, `computeTickInterval`, `formatTickLabel`, `snapTimeToGrid`).

### Component 3: Commands & Public Barrel (`packages/authoring-studio/src/timeline/`)
- **`TimelineCommands.ts` (Existing / Verify):** Productivity command DTO descriptors.
- **`index.ts` (Clean Public Barrel Export — F-04 Fix):** Restricts public exports strictly to S36 Authoring APIs, excluding PM37 runtime modules (`TimelinePlaybackSession`, `TimelineTransportController`, `TimelineStudioBridge`).

### Component 4: Golden E2E Integration Test (`packages/authoring-studio/src/timeline/__tests__/`)
- **`TimelineE2EWorkflow.test.ts`:** Golden E2E integration test verifying full authoring workflow:
  `BuilderDocument` → complex `AnimationTimeline` (2 clips, 2 tracks, 3 keyframes, `speed = 1.5`) → `TimelineSelection` → keyframe value edit → keyframe easing edit → add keyframe → move keyframe → resize clip → `HistoryStack.push` → `undo` → `redo` → Lossless SSOT verification.

---

## 3. Implementation Steps Roadmap

### Step 1 — Architecture Verification & Freeze Compliance
- Confirm `S36_ARCHITECTURE.md` approval by Agent 2 & Architect.
- Verify frozen status of S1–S35 modules and `BuilderDocument.ts`.

### Step 2 — Lossless Document Binding Audit
- Audit `timelineDocumentBinding.ts` for strict compliance with the Lossless DTO Patching Rule (DECISION-047).
- Confirm zero flatten/rebuild operations.

### Step 3 — Golden E2E Integration Test Implementation
- Implement `TimelineE2EWorkflow.test.ts` in `packages/authoring-studio/src/timeline/__tests__/`.
- Validate full multi-clip, multi-track, multi-keyframe authoring lifecycle with real `HistoryStack<BuilderDocument>` without runtime playback.

### Step 4 — Quality Gates & Verification
- Execute Vitest S36 subset: `npx vitest run packages/authoring-studio/src/timeline/__tests__/TimelineE2EWorkflow.test.ts`
- Execute full authoring-studio timeline regression: `npx vitest run packages/authoring-studio/src/timeline/__tests__/`
- Execute TypeScript check (`npx tsc --noEmit`).
- Execute production build check (`npm run build`).

---

## 4. Verification Plan & Acceptance Thresholds

### Automated Commands
```bash
# 1. Scope Vitest S36 suite
npx vitest run packages/authoring-studio/src/timeline/__tests__/

# 2. TypeScript compilation check
npx tsc --noEmit

# 3. Production Build check
npm run build
```

### Acceptance Thresholds
- **Vitest S36 Scope:** 100% PASS across S36 timeline selection, viewport, cursor, grid, binding, and Golden E2E integration test suites.
- **TypeScript:** 0 errors in S36 scope.
- **Build:** Exit code 0 (`ignoreBuildErrors: false`).
- **SSOT Integrity:** `BuilderDocument.ts` remains 100% FROZEN and untouched; SSOT key `animationTimeline` preserved losslessly.
- **Domain Boundary:** Clean grep for `PlaybackController`, `RuntimeScheduler`, `requestAnimationFrame`, `TimelineStudioBridge` in `packages/authoring-studio/src/timeline/index.ts`.

---

## 5. Governance Workflow

```
[Agent 1 Repo Discovery & Architecture (Faza S36-A)]
                         │
                         ▼
[Agent 2 Architecture Audit & Review (Faza S36-B)]
                         │
                  +------+------+
                  │             │
               (PASS)        (HOLD)
                  │             │
                  v             v
       [Architect Approval]   [Architecture Delta]
                  │
                  v
       [Agent 1 Implementation Phase (Faza S36-C)]
```

*Agent 1 does not execute code implementation until Agent 2 and Architect approve the architecture.*
